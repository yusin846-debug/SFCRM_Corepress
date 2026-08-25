List<CorePress_RFP__c> qcRfps = [SELECT Id, Lead__c FROM CorePress_RFP__c WHERE Title__c LIKE '[QC]%' AND Account__c = '001gK00001NQZsPQAX'];
Set<Id> qcLeadIds = new Set<Id>();
for (CorePress_RFP__c rfp : qcRfps) if (rfp.Lead__c != null) qcLeadIds.add(rfp.Lead__c);
if (!qcRfps.isEmpty()) delete qcRfps;

List<Opportunity> qcOpportunities = [SELECT Id FROM Opportunity WHERE Name LIKE '[QC]%' AND AccountId = '001gK00001NQZsPQAX'];
if (!qcOpportunities.isEmpty()) delete qcOpportunities;

List<Lead> qcLeads = qcLeadIds.isEmpty() ? new List<Lead>() : [SELECT Id FROM Lead WHERE Id IN :qcLeadIds];
if (!qcLeads.isEmpty()) delete qcLeads;

System.debug('HANBIT_QC_CLEANUP RFP=' + qcRfps.size() + ' OPPORTUNITY=' + qcOpportunities.size() + ' LEAD=' + qcLeads.size());
