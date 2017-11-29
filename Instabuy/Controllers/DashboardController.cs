using Instabuy.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Instabuy.ViewModels;
using Instabuy.DTOs;
using AutoMapper;
using Microsoft.AspNet.Identity;

namespace Instabuy.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private ApplicationDbContext _context;

        public DashboardController()
        {
            _context = new ApplicationDbContext();
        }

        protected override void Dispose(bool disposing)
        {
            _context.Dispose();
        }

        // GET: Dashboard
        public ActionResult Index()
        {
            var userId = User.Identity.GetUserId();
            var searchObjects = (from s in _context.SearchObjects
                                where s.UserId == userId
                                select s).ToList();

            List<SearchObjectDto> searchObjectDtos = new List<SearchObjectDto>();

            if(searchObjects != null)
            {
                for (var i = 0; i < searchObjects.Count; i++)
                {
                    var DTO = Mapper.Map<SearchObjectDto>(searchObjects[i]);
                    searchObjectDtos.Add(DTO);
                }
            }            

            var viewModel = new DashboardViewModel
            {
                ListingTypes = _context.ListingTypes.ToList(),
                ConditionTypes = _context.ConditionTypes.ToList(),
                SearchObjects = searchObjectDtos,
                SearchObjectDto = new SearchObjectDto(),
                hashKey = userId
            };
            return View(viewModel);
        }
    }
}