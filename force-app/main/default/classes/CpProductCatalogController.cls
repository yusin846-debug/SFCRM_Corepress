/**
 * Read-only product catalog lookups for public (guest) portal pages, such as
 * the catalog inquiry modal's product picklist. Runs without sharing since
 * the Guest User has no direct Product2 access, but only ever returns
 * non-sensitive product names for active equipment lines.
 */
public without sharing class CpProductCatalogController {
    // Families visible in the customer-facing catalog list. Includes the parts
    // line so 필터·부품 cards can render with matching photos.
    private static final List<String> EQUIPMENT_FAMILIES = new List<String>{ '압축기', '드라이어', '필터·부품' };
    // Inquiry form's product picklist stays limited to compressors/dryers only.
    private static final List<String> INQUIRY_FAMILIES = new List<String>{ '압축기', '드라이어' };

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
            'SELECT Id, Name, Family FROM Product2 WHERE IsActive = true AND Family IN :INQUIRY_FAMILIES ORDER BY Family, Name',
            AccessLevel.SYSTEM_MODE
        )) {
            options.add(new ProductOption(product));
        }
        return options;
    }

    /**
     * Returns the full equipment catalog (compressors + dryers) with the
     * fields the portal's product list page needs: name, family, description,
     * Standard Pricebook price, and CorePress-specific spec fields
     * (expected life, overhaul interval, consumable flag).
     */
    @AuraEnabled(cacheable=true)
    public static List<ProductCard> getEquipmentCatalog() {
        Map<Id, Decimal> priceByProduct = new Map<Id, Decimal>();
        for (PricebookEntry entry : [
            SELECT Product2Id, UnitPrice
            FROM PricebookEntry
            WHERE Pricebook2.IsStandard = true AND IsActive = true
        ]) {
            priceByProduct.put(entry.Product2Id, entry.UnitPrice);
        }
        List<ProductCard> cards = new List<ProductCard>();
        for (Product2 product : [
            SELECT Id, Name, Family, Description, Expected_Life_Years__c, Overhaul_Interval_Hours__c, Is_Consumable__c
            FROM Product2
            WHERE IsActive = true AND Family IN :EQUIPMENT_FAMILIES
            ORDER BY Family, Name
        ]) {
            cards.add(new ProductCard(product, priceByProduct.get(product.Id)));
        }
        return cards;
    }

    /**
     * Returns a single Product2's public-facing detail for the portal product
     * detail page. Guest-safe (public info only).
     */
    @AuraEnabled(cacheable=true)
    public static ProductCard getProductDetail(Id productId) {
        if (productId == null) {
            return null;
        }
        List<Product2> matches = [
            SELECT Id, Name, Family, Description, Expected_Life_Years__c, Overhaul_Interval_Hours__c, Is_Consumable__c
            FROM Product2
            WHERE Id = :productId AND IsActive = true AND Family IN :EQUIPMENT_FAMILIES
            LIMIT 1
        ];
        if (matches.isEmpty()) {
            return null;
        }
        List<PricebookEntry> entries = [
            SELECT UnitPrice FROM PricebookEntry
            WHERE Product2Id = :productId AND Pricebook2.IsStandard = true AND IsActive = true
            LIMIT 1
        ];
        Decimal price = entries.isEmpty() ? null : entries[0].UnitPrice;
        return new ProductCard(matches[0], price);
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

    /**
     * Portal-facing view of a single Product2 for the catalog list/detail.
     */
    public class ProductCard {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String family;
        @AuraEnabled public String description;
        @AuraEnabled public Decimal expectedLifeYears;
        @AuraEnabled public Decimal overhaulIntervalHours;
        @AuraEnabled public Boolean isConsumable;
        @AuraEnabled public Decimal standardPrice;

        public ProductCard(Product2 product, Decimal price) {
            this.id = product.Id;
            this.name = product.Name;
            this.family = product.Family;
            this.description = product.Description;
            this.expectedLifeYears = product.Expected_Life_Years__c;
            this.overhaulIntervalHours = product.Overhaul_Interval_Hours__c;
            this.isConsumable = product.Is_Consumable__c;
            this.standardPrice = price;
        }
    }
}
