/*
 RequireJS i18n 0.24.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 Available via the MIT or new BSD license.
 see: http://github.com/jrburke/requirejs for details
*/
(function(){function r(b,a,i,d,c,e){if(a[b]){i.push(b);if(a[b]===true||a[b]===1)d.push(c+b+"/"+e)}}function s(b,a,i,d,c){a=d+a+"/"+c;require._fileExists(b.nameToUrl(a,null))&&i.push(a)}var u=/(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/;define({version:"0.24.0",load:function(b,a,i,d){d=d||{};var c=u.exec(b),e=c[1],o=c[4],f=c[5],p=o.split("-"),g=[],t={},j,h,k="";if(c[5]){e=c[1];b=e+f}else{b=b;f=c[4];o=d.locale||(d.locale=typeof navigator==="undefined"?"root":(navigator.language||navigator.userLanguage||
"root").toLowerCase());p=o.split("-")}if(d.isBuild){g.push(b);s(a,"root",g,e,f);for(j=0;h=p[j];j++){k+=(k?"-":"")+h;s(a,k,g,e,f)}a(g);i()}else a([b],function(q){var m=[];r("root",q,m,g,e,f);for(j=0;h=p[j];j++){k+=(k?"-":"")+h;r(k,q,m,g,e,f)}a(g,function(){var n,l;for(n=m.length-1;n>-1&&(h=m[n]);n--){l=q[h];if(l===true||l===1)l=a(e+h+"/"+f);require.mixin(t,l)}i(t)})})}})})();
