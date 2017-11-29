using Instabuy.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Instabuy.Controllers.APIs
{
    public class EbaySearchController : ApiController
    {

        private ApplicationDbContext _context;

        public EbaySearchController()
        {
            _context = new ApplicationDbContext();
        }

        protected override void Dispose(bool disposing)
        {
            _context.Dispose();
        }

        [HttpGet]
        public IHttpActionResult Get(int id)
        {
            // Basic validation
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

            var searchObject = _context.SearchObjects.FirstOrDefault(c => c.Id == id);

            if (searchObject == null)
            {
                return NotFound();
            }

            if (searchObject.UserId != auth)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a valid user"));
            }

            var currTimestamp = (DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, 0)).TotalSeconds;
            var lastCalled = BitConverter.ToDouble(searchObject.LastCalled, 0);

            // Only execute once every 1 minute per search object
            if ((currTimestamp - lastCalled) >= 55)     // compared to 55 seconds due to server response times...
            {
                // update when the query was last called
                searchObject.LastCalled = BitConverter.GetBytes((DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, 0)).TotalSeconds);
                _context.SaveChanges();

                var i = 0;

                // Create the search string to call the ebay api with
                var searchString = "http://svcs.ebay.com/services/search/FindingService/v1?";
                searchString += "OPERATION-NAME=findItemsByKeywords";
                searchString += "&SERVICE-VERSION=1.0.0";
                searchString += "&SECURITY-APPNAME=AlyMilla-Instabuy-PRD-e5d74fc8f-5894de12";
                searchString += "&RESPONSE-DATA-FORMAT=JSON";
                searchString += "&REST-PAYLOAD";
                searchString += "&GLOBAL-ID=EBAY-GB";
                searchString += "&itemFilter(" + i + ").name=HideDuplicateItems";
                searchString += "&itemFilter(" + i + ").value=true";
                i++;
                searchString += "&itemFilter(" + i + ").name=StartTimeFrom";
                var currDateTime = DateTime.UtcNow.AddMinutes(-10).ToString("yyyy-MM-ddTHH\\:mm\\:ss.fffK");     // subtract 5 minutes to account for difference in server time
                searchString += "&itemFilter(" + i + ").value=" + currDateTime;
                i++;

                // MIN PRICE
                if (searchObject.MinPrice != null)
                {
                    searchString += "&itemFilter(" + i + ").name=MinPrice";
                    searchString += "&itemFilter(" + i + ").value=" + searchObject.MinPrice.ToString();
                    searchString += "&itemFilter(" + i + ").paramName=Currency";
                    searchString += "&itemFilter(" + i + ").paramName=GBP";
                    i++;
                }

                // MAX PRICE
                if (searchObject.MaxPrice != null)
                {
                    searchString += "&itemFilter(" + i + ").name=MaxPrice";
                    searchString += "&itemFilter(" + i + ").value=" + searchObject.MaxPrice.ToString();
                    searchString += "&itemFilter(" + i + ").paramName=Currency";
                    searchString += "&itemFilter(" + i + ").paramName=GBP";
                    i++;
                }

                // LISTING TYPE - Exclude All as it is not a valid term
                searchString += "&itemFilter(" + i + ").name=ListingType";
                searchString += "&itemFilter(" + i + ").value=" + searchObject.ListingType;
                i++;

                // CONDITION TYPE
                if (searchObject.ConditionType != "Any")
                {
                    searchString += "&itemFilter(" + i + ").name=Condition";
                    searchString += "&itemFilter(" + i + ").value=" + searchObject.ConditionType;
                    i++;
                }
                searchString += "&keywords=" + searchObject.Keywords;

                HttpClient client = new HttpClient();
                client.BaseAddress = new Uri(HttpContext.Current.Request.Url.AbsoluteUri);
                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

                HttpResponseMessage response = client.GetAsync(searchString).Result;
                if(response.IsSuccessStatusCode)
                {
                    // return the returned string
                    var ebayResponse = response.Content.ReadAsStringAsync().Result;
                    string returnResult = ebayResponse.Replace("\\\"", "");
                    return Ok(returnResult);
                } else
                {
                    return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.ServiceUnavailable, "Sorry. Instabuy seems to be running into problems right now. Come back and try again later"));
                }                
            } else
            {
                return BadRequest("You must wait 1 minute per request per search object.");
            }
        }
    }
}
