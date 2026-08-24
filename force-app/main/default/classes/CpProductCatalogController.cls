/**
 * Read-only product catalog lookups for public (guest) portal pages, such as
 * the catalog inquiry modal's product picklist. Runs without sharing since
 * the Guest User has no direct Product2 access, but only ever returns
 * non-sensitive product names for active equipment lines.
 */
public without sharing class CpProductCatalogController {
    private static final List<String> EQUIPMENT_FAMILIES = new List<String>{ '압축기', '드라이어' };

    /**
     * Returns active equipment Product2 records (compressors and dryers) for
     * use in customer-facing product selection controls.
     *
     * @return List of ProductOption ordered by product family then name.
     */
    @AuraEnabled(cacheable=true)
    public static List<ProductOption> getEquipmentProducts() {
        List<ProductOption> options = new List<ProductOption>();
        for (Product2 product : Database.query(
            'SELECT Id, Name, Family FROM Product2 WHERE IsActive = true AND Family IN :EQUIPMENT_FAMILIES ORDER BY Family, Name',
            AccessLevel.SYSTEM_MODE
        )) {
            options.add(new ProductOption(product));
        }
        return options;
    }

    /**
     * Product name and family pair exposed to Lightning Web Components.
     */
    public class ProductOption {
        @AuraEnabled
        public String name { get; set; }
        @AuraEnabled
        public String family { get; set; }

        public ProductOption(Product2 product) {
            this.name = product.Name;
            this.family = product.Family;
        }
    }
}
