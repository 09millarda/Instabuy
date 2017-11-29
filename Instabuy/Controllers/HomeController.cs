using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;

namespace Instabuy.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            if(string.IsNullOrEmpty(User.Identity.Name))
            {
                return View();
            }
            return RedirectToAction("", "Dashboard");
        }
    }
}