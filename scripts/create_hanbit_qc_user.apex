Contact qcContact = [
    SELECT Id, AccountId
    FROM Contact
    WHERE Id = '003gK000010AxJFQA0'
    LIMIT 1
];
String qcUsername = 'kim.dohyun.corepress.qc.20260825@example.com';
List<User> existingUsers = [SELECT Id FROM User WHERE Username = :qcUsername LIMIT 1];
if (existingUsers.isEmpty()) {
    User templateUser = [
        SELECT ProfileId, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey
        FROM User
        WHERE ContactId = '003gK00000zpUs9QAE'
        LIMIT 1
    ];
    User qcUser = new User(
        Username = qcUsername,
        Email = 'kim.dohyun.qc@example.com',
        LastName = '김도현',
        Alias = 'kdohyun',
        CommunityNickname = 'kimdohyunqc20260825',
        ContactId = qcContact.Id,
        ProfileId = templateUser.ProfileId,
        TimeZoneSidKey = templateUser.TimeZoneSidKey,
        LocaleSidKey = templateUser.LocaleSidKey,
        EmailEncodingKey = templateUser.EmailEncodingKey,
        LanguageLocaleKey = templateUser.LanguageLocaleKey,
        IsActive = true
    );
    insert qcUser;
}
System.debug('Hanbit QC user ready: ' + qcUsername);
