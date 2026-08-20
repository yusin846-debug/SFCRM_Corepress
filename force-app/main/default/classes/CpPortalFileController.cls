public with sharing class CpPortalFileController {
    @AuraEnabled
    public static Id uploadFile(Id recordId, String fileName, String base64Data) {
        if (recordId == null || String.isBlank(fileName) || String.isBlank(base64Data)) {
            throw new AuraHandledException('파일 정보가 올바르지 않습니다.');
        }

        Case targetCase = [SELECT Id, AccountId FROM Case WHERE Id = :recordId WITH USER_MODE LIMIT 1];
        User currentUser = [SELECT ContactId, Contact.AccountId, Profile.PermissionsModifyAllData FROM User WHERE Id = :UserInfo.getUserId()];
        Boolean isAdmin = currentUser.Profile.PermissionsModifyAllData;
        Boolean isOwningCustomer = currentUser.ContactId != null && currentUser.Contact.AccountId == targetCase.AccountId;
        if (!isAdmin && !isOwningCustomer) {
            throw new AuraHandledException('이 서비스 요청에 파일을 첨부할 권한이 없습니다.');
        }

        Blob body;
        try {
            body = EncodingUtil.base64Decode(base64Data);
        } catch (Exception error) {
            throw new AuraHandledException('파일을 읽을 수 없습니다.');
        }
        if (body.size() > 2 * 1024 * 1024) {
            throw new AuraHandledException('파일은 2MB 이하만 첨부할 수 있습니다.');
        }

        ContentVersion version = new ContentVersion(
            Title = sanitizeTitle(fileName),
            PathOnClient = '/' + fileName,
            VersionData = body,
            FirstPublishLocationId = targetCase.Id
        );
        insert as user version;
        return version.Id;
    }

    @TestVisible
    private static String sanitizeTitle(String fileName) {
        Integer dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    }
}