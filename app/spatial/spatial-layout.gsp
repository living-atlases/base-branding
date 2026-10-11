<%--
  spatial-layout.gsp — branding skin for the Spatial Portal (spatial-hub)

  OWNED BY the branding repo (source: app/spatial/spatial-layout.gsp, output: dist/spatial/views/layouts/).
  Do NOT edit the deployed copy.

  Based on spatial-hub 3.x grails-app/views/layouts/portal.gsp. The hardcoded ALA header is replaced by
  <hf:banner/>, i.e. the SAME banner.html (Bootstrap 3) every other module of the portal shows, taken from
  headerAndFooter.baseURL (so the branding looks identical in the hub and in the rest of the services).
  Everything the map application needs is kept VERBATIM from portal.gsp — if you bump spatial-hub, diff its
  portal.gsp and re-sync:
    <g:layoutTitle/> <g:layoutHead/> <g:layoutBody/>, <ala:systemMessage/>,
    <asset:stylesheet href="application.css"/>, <asset:deferredScripts/>,
    <asset:javascript src="commonui-bs3-2019/js/application.min.js"/> + commonui-bs3-2019.js,
    the #main container and the fluidLayout / loginStatus / skin.header g:set logic.

  Why the <style> block: spatial-hub's commonui-bs3-2019.css / spatial-hub-generic.css hack the ALA header so
  it is ALWAYS the mobile variant (.hidden-xs/.hidden-sm hidden, .hidden-md/.hidden-lg shown, .navbar-toggle
  display:block !important, li floats off, collapse height 340px). A branding banner is a normal responsive
  Bootstrap 3 header, so the block restores the Bootstrap 3 behaviour inside #la-spatial-header only.

  Deployment: /data/spatial-hub/views/layouts/spatial-layout.gsp (external views resolver, see spatial-hub
  BootStrap.groovy addExternalViews); activate with  skin.layout=spatial-layout  and set
  headerAndFooter.baseURL (+ version: '2') to the branding (Bootstrap 3 build, not the /bs5 one).
--%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta name="app.version" content="${g.meta(name: 'info.app.version')}"/>
    <meta name="app.build" content="${g.meta(name: 'info.app.build')}"/>
    <meta name="description" content="${grailsApplication.config.skin?.orgNameLong ?: 'Living Atlas'}"/>
    <meta name="author" content="${grailsApplication.config.skin?.orgNameLong ?: 'Living Atlas'}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Favicon (runtime config) -->
    <link href="${grailsApplication.config.favicon.url}" rel="shortcut icon" type="image/x-icon"/>

    <title><g:layoutTitle/></title>
    <g:layoutHead/>
    <!-- Header + map styles: the spatial-hub WAR's application.css already ships the commonui/ala
         styles every module header uses, so the navbar below needs no extra stylesheet. -->
    <asset:stylesheet href="application.css"/>
    <g:if test="${grailsApplication.config.fathomId != null && grailsApplication.config.fathomId != ''}">
        <script src="https://cdn.usefathom.com/script.js" data-site="${grailsApplication.config.fathomId}" defer></script>
    </g:if>
</head>

<body class="${pageProperty(name: 'body.class')}" id="${pageProperty(name: 'body.id')}"
      onload="${pageProperty(name: 'body.onload')}">
<g:set var="fluidLayout" value="${pageProperty(name: 'meta.fluidLayout') ?: grailsApplication.config.skin.fluidLayout}"/>
<g:set var="loginStatus" value="${request.userPrincipal ? 'signedIn' : 'signedOut'}"/>
<g:set var="headerVisiblity" value="${(grailsApplication.config.skin.header && grailsApplication.config.spApp.header) ? '' : 'hidden'}"/>

<style>
/* spatial-hub's commonui-bs3-2019.css forces the mobile variant of the ALA header (.hidden-xs/.hidden-sm
   always hidden, floats off...). A branding banner is a normal responsive Bootstrap 3 header: restore it. */
#la-spatial-header .hidden-xs, #la-spatial-header .hidden-sm,
#la-spatial-header .hidden-md, #la-spatial-header .hidden-lg { display: revert !important; }
@media (max-width: 767px) { #la-spatial-header .hidden-xs { display: none !important; } }
@media (min-width: 768px) and (max-width: 991px) { #la-spatial-header .hidden-sm { display: none !important; } }
@media (min-width: 992px) and (max-width: 1199px) { #la-spatial-header .hidden-md { display: none !important; } }
@media (min-width: 1200px) { #la-spatial-header .hidden-lg { display: none !important; } }
#la-spatial-header .navbar-nav > li { float: left; }
#la-spatial-header .navbar-collapse.collapse { height: auto !important; overflow: visible !important; }
@media (min-width: 768px) { #la-spatial-header .navbar-toggle { display: none !important; } }
@media (max-width: 767px) { #la-spatial-header .navbar-nav > li { float: none; } }
</style>
<g:if test="${headerVisiblity != 'hidden'}"><div id="la-spatial-header"><hf:banner/></div></g:if>
<!-- =================== end Living Atlas header =================== -->

<!-- System message banner (runtime) -->
<ala:systemMessage/>

<!-- Map application content -->
<div class="${fluidLayout ? 'container-fluid' : 'container'}" id="main">
    <g:layoutBody/>
</div><!-- End #main -->

<asset:deferredScripts/>
<asset:javascript src="commonui-bs3-2019/js/application.min.js"/>
<asset:javascript src="commonui-bs3-2019.js"/>

<!-- Google Analytics (runtime) -->
<g:if test="${grailsApplication.config.googleAnalyticsId != null && grailsApplication.config.googleAnalyticsId != ''}">
    <script>
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () { (i[r].q = i[r].q || []).push(arguments) }, i[r].l = 1 * new Date();
            a = s.createElement(o), m = s.getElementsByTagName(o)[0];
            a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
        ga('create', '${grailsApplication.config.googleAnalyticsId}', 'auto');
        ga('send', 'pageview');
    </script>
</g:if>
</body>
</html>
