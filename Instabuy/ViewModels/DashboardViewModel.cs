using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Instabuy.Models;
using Instabuy.DTOs;

namespace Instabuy.ViewModels
{
    public class DashboardViewModel
    {
        public IEnumerable<ListingType> ListingTypes { get; set; }
        public IEnumerable<ConditionType> ConditionTypes { get; set; }
        public SearchObjectDto SearchObjectDto { get; set; }
        public string hashKey { get; set; }
        public List<SearchObjectDto> SearchObjects { get; set; }
    }
}