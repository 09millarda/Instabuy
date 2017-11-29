using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Instabuy.DTOs
{
    public class SearchObjectDto
    {
        [Required]
        [Display(Name="Search Object Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(30)]
        [MinLength(1)]
        [Display(Name = "Search Object Name")]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        [MinLength(1)]
        [Display(Name = "Keywords")]
        public string Keywords { get; set; }

        [Required]
        [Display(Name = "Condition Type")]
        public byte ConditionTypeId { get; set; }

        [Required]
        [Display(Name = "Listing Type")]
        public byte ListingTypeId { get; set; }

        [Display(Name = "Minimum Seller Feedback Score")]
        [Range(0, 32768)]
        public short? FeedbackScoreMin { get; set; }

        public string ListingType { get; set; }
        public string ConditionType { get; set; }

        [Display(Name = "Minimum Price")]
        [Range(0, 2147483647)]
        public int? MinPrice { get; set; }

        [Display(Name = "Maximum Price")]
        [Range(0, 2147483647)]
        public int? MaxPrice { get; set; }

        [Required]
        [Display(Name = "Allow Returns")]
        public bool ReturnsAcceptedOnly { get; set; }
    }
}