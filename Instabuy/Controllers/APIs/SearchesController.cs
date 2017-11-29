using Instabuy.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Instabuy.Models.Validators;
using Instabuy.DTOs;
using AutoMapper;
using System.Web;

namespace Instabuy.Controllers.APIs
{
    // All share the same basic security and authentication process - return bad request if not verified etc.
    public class SearchesController : ApiController
    {
        private ApplicationDbContext _context;

        public SearchesController()
        {
            _context = new ApplicationDbContext();
        }

        protected override void Dispose(bool disposing)
        {
            _context.Dispose();
        }

        [HttpPut]
        public IHttpActionResult Put(SearchObjectDto searchObjectDto)
        {
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

            var searchObject = _context.SearchObjects.FirstOrDefault(c => c.Id == searchObjectDto.Id);

            if (searchObject == null)
            {
                return NotFound();
            }

            if (searchObject.UserId != auth)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a valid user"));
            }

            if(!ModelState.IsValid)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Invalid information"));
            }

            // update the search object with the new information
            searchObject.Name = searchObjectDto.Name;
            searchObject.Keywords = searchObjectDto.Keywords;
            searchObject.ListingTypeId = searchObjectDto.ListingTypeId;
            searchObject.ConditionTypeId = searchObjectDto.ConditionTypeId;
            searchObject.FeedbackScoreMin = searchObjectDto.FeedbackScoreMin;
            searchObject.ReturnsAcceptedOnly = searchObjectDto.ReturnsAcceptedOnly;
            searchObject.MinPrice = searchObjectDto.MinPrice;
            searchObject.MaxPrice = searchObjectDto.MaxPrice;
            searchObject.ListingType = _context.ListingTypes.FirstOrDefault(c => c.Id == searchObjectDto.ListingTypeId).Name.Replace(" ", "");
            searchObject.ConditionType = _context.ConditionTypes.FirstOrDefault(c => c.Id == searchObjectDto.ConditionTypeId).Name.Replace(" ", "");
            _context.SaveChanges();

            searchObjectDto = Mapper.Map<SearchObjectDto>(searchObject);

            return ResponseMessage(Request.CreateResponse(HttpStatusCode.OK, searchObjectDto));
        }

        [HttpDelete]
        public IHttpActionResult Delete(int id)
        {
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

            _context.SearchObjects.Remove(searchObject);
            _context.SaveChanges();

            return ResponseMessage(Request.CreateResponse(HttpStatusCode.OK));
        }

        [HttpGet]
        public IHttpActionResult Get(int id)
        {
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

            if(searchObject == null)
            {
                return NotFound();
            }

            if (searchObject.UserId != auth)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a valid user"));
            }

            var searchObjectDto = Mapper.Map<SearchObjectDto>(searchObject);
            return Ok(searchObjectDto);
        }

        [HttpPost]
        public IHttpActionResult Post(SearchObjectDto searchObjectDto)
        {
            string auth = null;
            try
            {
                auth = Request.Headers.GetValues("Authorization").FirstOrDefault();

            } catch
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a verified user"));
            }

            if (auth == null)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a verified user"));
            }

            var user = _context.Users.FirstOrDefault(c => c.Id == auth);

            if(user == null)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "You are not a verified user"));
            }

            if (!ModelState.IsValid)
            {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Invalid information"));
            }

            var searchObjectUser = (from s in _context.SearchObjects
                                    where s.UserId == auth
                                    select s).ToList();

            if(searchObjectUser.Count >= 3) {
                return ResponseMessage(Request.CreateErrorResponse(HttpStatusCode.BadRequest, "You are only allowed 3 search objects"));
            }

            SearchObject searchObject = Mapper.Map<SearchObject>(searchObjectDto);
            searchObject.UserId = auth;
            searchObject.ListingType = _context.ListingTypes.FirstOrDefault(c => c.Id == searchObjectDto.ListingTypeId).Name.Replace(" ", "");
            searchObject.ConditionType = _context.ConditionTypes.FirstOrDefault(c => c.Id == searchObjectDto.ConditionTypeId).Name.Replace(" ", "");
            searchObject.LastCalled = BitConverter.GetBytes((DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, 0)).TotalSeconds - (1000 * 60 * 1));    // Sets time of last called to -1 minutes
            _context.SearchObjects.Add(searchObject);
            _context.SaveChanges();

            searchObjectDto = Mapper.Map<SearchObjectDto>(searchObject);

            return Created(Request.RequestUri + "/api/Searches/" + searchObjectDto.Id, searchObjectDto);
        }
    }
}
