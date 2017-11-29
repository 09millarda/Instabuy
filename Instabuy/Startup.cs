using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Instabuy.Startup))]
namespace Instabuy
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
