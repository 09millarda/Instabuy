using Instabuy.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace Instabuy.Controllers.APIs
{
    public class ItemSearchController : ApiController
    {
        private ApplicationDbContext _context;

        public ItemSearchController()
        {
            _context = new ApplicationDbContext();
        }

        protected override void Dispose(bool disposing)
        {
            _context.Dispose();
        }

        [HttpGet]
        public IHttpActionResult Get(string id)
        {
            // basic security and authentication
            string auth = null;
            try
            {
                auth = Request.Headers.GetValues("Authorization").FirstOrDefault();
            }
            catch
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a verified user"));
            }

            if (auth == null)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a verified user"));
            }

            // search for the selected item
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(HttpContext.Current.Request.Url.AbsoluteUri);
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

            var searchString = "http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=AlyMilla-Instabuy-PRD-e5d74fc8f-5894de12&siteid=3&version=967&ItemID=" + id + "&IncludeSelector=TextDescription,ItemSpecifics,Details";

            HttpResponseMessage response = client.GetAsync(searchString).Result;
            if (response.IsSuccessStatusCode)
            {
                var ebayResponse = response.Content.ReadAsStringAsync().Result;
                string returnResult = ebayResponse.Replace("\\\"", "");
                return Ok(returnResult);
            }
            else
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.ServiceUnavailable, "Sorry. Instabuy seems to be running into problems right now. Come back and try again later"));
            }
        }
    }
}
