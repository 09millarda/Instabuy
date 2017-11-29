using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Instabuy.Models
{
    public class SearchObject
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(30)]
        [MinLength(1)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        [MinLength(1)]
        public string Keywords { get; set; }

        [Required]
        public byte ConditionTypeId { get; set; }
        public string ConditionType { get; set; }

        [Required]
        public byte ListingTypeId { get; set; }
        public string ListingType { get; set; }

        [Range(0, 32768)]
        public short? FeedbackScoreMin { get; set; }

        [Range(0, 2147483647)]
        public int? MinPrice { get; set; }

        [Range(0, 2147483647)]
        public int? MaxPrice { get; set; }

        [Required]
        public bool ReturnsAcceptedOnly { get; set; }

        public string UserId { get; set; }

        public byte[] LastCalled { get; set; }
    }
}