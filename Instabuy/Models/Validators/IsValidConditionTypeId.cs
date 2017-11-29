using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Instabuy.Models.Validators
{
    public class IsValidConditionTypeId : ValidationAttribute
    {
        private ApplicationDbContext _context;

        public IsValidConditionTypeId()
        {
            _context = new ApplicationDbContext();
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var conditionTypeIds = _context.ConditionTypes.ToList().Select(c => c.Id).ToArray();

            if(conditionTypeIds.Contains((byte)validationContext.ObjectInstance))
            {
                return ValidationResult.Success;
            }
            return new ValidationResult("Invalid Condition Type");
        }
    }
}