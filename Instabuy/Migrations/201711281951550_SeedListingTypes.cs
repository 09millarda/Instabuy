namespace Instabuy.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class SeedListingTypes : DbMigration
    {
        public override void Up()
        {
            Sql("INSERT INTO ListingTypes (Name) VALUES ('All')");
            Sql("INSERT INTO ListingTypes (Name) VALUES ('Fixed Price')");
            Sql("INSERT INTO ListingTypes (Name) VALUES ('Auction With BIN')");
            Sql("INSERT INTO ListingTypes (Name) VALUES ('Auction')");
        }
        
        public override void Down()
        {
        }
    }
}
