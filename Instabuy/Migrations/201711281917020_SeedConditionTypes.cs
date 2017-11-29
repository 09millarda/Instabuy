namespace Instabuy.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class SeedConditionTypes : DbMigration
    {
        public override void Up()
        {
            Sql(@"INSERT INTO ConditionTypes(Id, Name) VALUES (1, 'New')");
            Sql(@"INSERT INTO ConditionTypes(Id, Name) VALUES (2, 'Manufacturer refurbished')");
            Sql(@"INSERT INTO ConditionTypes(Id, Name) VALUES (3, 'Used')");
            Sql(@"INSERT INTO ConditionTypes(Id, Name) VALUES (4, 'For parts or not working')");
            Sql(@"INSERT INTO ConditionTypes(Id, Name) VALUES (5, 'Any')");
        }
        
        public override void Down()
        {
        }
    }
}
