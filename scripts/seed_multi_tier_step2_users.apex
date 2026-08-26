// STEP 2 (setup DML): Create 3 portal Users, set demo password, assign
// portal permission sets. Prerequisites: step 1 (accounts/contacts/assets)
// already committed. Idempotent — re-runs skip existing users and PSAs.

Id portalProfileId = '00egK00000C6Yp7QAF'; // Customer Community Plus Login User
String demoPassword = 'CorePress2026!';

Map<String, Id> contactIdByEmail = new Map<String, Id>();
for (Contact c : [
  SELECT Id, Email FROM Contact
  WHERE Email IN ('kang.taeho@samyangheavy.demo','park.seojun@jungminplastic.demo','jung.soyoung@sungjin.demo')
]) { contactIdByEmail.put(c.Email, c.Id); }
if (contactIdByEmail.size() != 3) {
  throw new IllegalArgumentException('Missing contacts — run step 1 first. Found: ' + contactIdByEmail.keySet());
}

// -------- Users --------
Map<String, Map<String, String>> usernameToProfile = new Map<String, Map<String, String>>{
  'kang.taeho@samyangheavy.demo'    => new Map<String, String>{'firstName'=>'태호','lastName'=>'강','alias'=>'kangth','nick'=>'kang_taeho_samyang'},
  'park.seojun@jungminplastic.demo' => new Map<String, String>{'firstName'=>'서준','lastName'=>'박','alias'=>'parksj','nick'=>'park_seojun_jungmin'},
  'jung.soyoung@sungjin.demo'       => new Map<String, String>{'firstName'=>'소영','lastName'=>'정','alias'=>'jungsy','nick'=>'jung_soyoung_sungjin'}
};

Map<String, User> existingUsers = new Map<String, User>();
for (User u : [SELECT Id, Username, IsActive FROM User WHERE Username IN :usernameToProfile.keySet()]) {
  existingUsers.put(u.Username, u);
}
List<User> newUsers = new List<User>();
for (String uname : usernameToProfile.keySet()) {
  if (existingUsers.containsKey(uname)) continue;
  Map<String, String> p = usernameToProfile.get(uname);
  newUsers.add(new User(
    ContactId = contactIdByEmail.get(uname),
    Username = uname, Email = uname,
    FirstName = p.get('firstName'), LastName = p.get('lastName'),
    Alias = p.get('alias'), CommunityNickname = p.get('nick'),
    TimeZoneSidKey = 'Asia/Seoul', LocaleSidKey = 'ko_KR',
    EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'ko',
    ProfileId = portalProfileId, IsActive = true
  ));
}
if (!newUsers.isEmpty()) {
  insert newUsers;
  for (User u : newUsers) existingUsers.put(u.Username, u);
  System.debug('Inserted ' + newUsers.size() + ' portal users');
} else {
  System.debug('All 3 users already exist');
}

// -------- Passwords --------
for (String uname : existingUsers.keySet()) {
  System.setPassword(existingUsers.get(uname).Id, demoPassword);
  System.debug('PASSWORD_SET: ' + uname + ' -> ' + demoPassword);
}

// -------- Permission Set assignments --------
List<String> permsetNames = new List<String>{
  'CorePress_PRT_Customer_Login',
  'CorePress_Opportunity_Portal_Access',
  'CorePress_Service_Detail_Access',
  'CorePress_Quote_Portal_Access'
};
Map<String, Id> permsetIdByName = new Map<String, Id>();
for (PermissionSet ps : [SELECT Id, Name FROM PermissionSet WHERE Name IN :permsetNames]) {
  permsetIdByName.put(ps.Name, ps.Id);
}
Set<Id> userIds = new Set<Id>();
for (User u : existingUsers.values()) userIds.add(u.Id);

Set<String> existingKeys = new Set<String>();
for (PermissionSetAssignment psa : [
  SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment
  WHERE AssigneeId IN :userIds AND PermissionSetId IN :permsetIdByName.values()
]) { existingKeys.add(psa.AssigneeId + '|' + psa.PermissionSetId); }

List<PermissionSetAssignment> toAssign = new List<PermissionSetAssignment>();
for (Id uid : userIds) {
  for (String name : permsetNames) {
    Id psId = permsetIdByName.get(name);
    if (psId == null) { System.debug('MISSING PERMSET: ' + name); continue; }
    if (existingKeys.contains(uid + '|' + psId)) continue;
    toAssign.add(new PermissionSetAssignment(AssigneeId = uid, PermissionSetId = psId));
  }
}
if (!toAssign.isEmpty()) {
  insert toAssign;
  System.debug('Assigned ' + toAssign.size() + ' PSAs');
} else {
  System.debug('All PSAs already exist');
}

System.debug('=== STEP 2 COMPLETE ===');
for (String uname : existingUsers.keySet()) {
  System.debug('  User: ' + uname + ' (Id=' + existingUsers.get(uname).Id + ') / password=' + demoPassword);
}
