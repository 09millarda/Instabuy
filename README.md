# Instabuy
http://instabuyapp.azurewebsites.net/

An eBay automated searcher client.

You can download and do whatever you want to this code.

About This Project:

I know on the website it says it is a portfolio peice, truth be told, it is a modified version of a product I made for my brother's company that was discontinued because I was too busy with university to keep working on it. The original was made using PHP but I thought I needed something that also showcased my C# ability so I changed it.

It uses the .NET MVC framework along with Entity Framework and Razor. It includes a neat little API that allows me to verify users and provide a regulated eBay Searcher (preventing users going over the 1-search-per-minute limit I instated). I am limited to just 5000 eBay requests per day which is why I did this, otherwise I would have made it so you could do 1 search every 5 seconds or something similar to that value.

If you want, you can read through the code. Most of it is commented (excluding most of the basic things) with explanations of how things work and why I chose to do things in certain ways.

I recommend reading the user manual guide (https://docs.google.com/document/d/1cqLRKj8dAo0rlEQZwQkmbcjX-b-GG6wLVBg9O01RqhM/) before 
using the application. Due to me not wanting to spend any money on this, I am using the free Microsoft Azure servers which do not 
permit me to install any sort of SSL certificate so be wary of the lack of security this entails when accessing the website.

Due to the lack of an SSL certificate, some browsers may not allow push notifications which takes away a lot of functionality of Instabuy. 
At time of release, Microsoft Edge seems to work perfectly well.

If you want to find out more contact me at millardaly@gmail.com.

Thanks
