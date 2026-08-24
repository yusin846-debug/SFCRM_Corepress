@IsTest
private class CpProductCatalogControllerTest {
    @TestSetup
    static void setup() {
        insert new List<Product2>{
            new Product2(Name = 'CP2100', Family = '압축기', IsActive = true),
            new Product2(Name = 'CD1000', Family = '드라이어', IsActive = true),
            new Product2(Name = 'CP2100 Gasket', Family = '필터·부품', IsActive = true),
            new Product2(Name = 'Inactive Compressor', Family = '압축기', IsActive = false)
        };
    }

    @IsTest
    static void returnsOnlyActiveEquipmentFamilies() {
        Test.startTest();
        List<CpProductCatalogController.ProductOption> options = CpProductCatalogController.getEquipmentProducts();
        Test.stopTest();

        Set<String> names = new Set<String>();
        for (CpProductCatalogController.ProductOption option : options) {
            names.add(option.name);
        }

        System.assertEquals(2, options.size(), 'Only active compressor/dryer products should be returned');
        System.assert(names.contains('CP2100'), 'Active compressor should be included');
        System.assert(names.contains('CD1000'), 'Active dryer should be included');
        System.assert(!names.contains('CP2100 Gasket'), 'Parts/accessories should be excluded');
        System.assert(!names.contains('Inactive Compressor'), 'Inactive products should be excluded');
    }
}
