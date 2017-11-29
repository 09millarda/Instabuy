using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Instabuy.Models;
using Instabuy.DTOs;

namespace Instabuy.App_Start
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<SearchObject, SearchObjectDto>();
            CreateMap<SearchObjectDto, SearchObject>();
        }
    }
}