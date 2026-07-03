<%--
  spatial-layout.gsp — Living Atlas skin for the Spatial Portal (spatial-hub)

  GENERATED / OWNED BY base-branding.
  Do NOT edit the deployed copy — edit this source at
  base-branding/app/spatial/spatial-layout.gsp and rebuild (`npm run build`).
  Output: dist/spatial/views/layouts/spatial-layout.gsp

  Local preview of this header (Vite dev server, HMR): testPageSpatial.html
  (http://localhost:3333/testPageSpatial.html). Keep its <nav> in sync with the header here.

  Based on spatial-hub 3.1.0 grails-app/views/layouts/portal.gsp. Only the site HEADER
  (the hardcoded ALA logo + menu) has been replaced with a Living Atlas navbar. Everything
  the map application needs is kept VERBATIM from portal.gsp — if you bump spatial-hub, diff
  its new portal.gsp and re-sync these bits:
    <g:layoutTitle/> <g:layoutHead/> <g:layoutBody/>, <ala:systemMessage/>,
    <asset:stylesheet href="application.css"/>, <asset:deferredScripts/>,
    <asset:javascript src="commonui-bs3-2019/js/application.min.js"/> + commonui-bs3-2019.js,
    the #main container and the fluidLayout / loginStatus / skin.header g:set logic.

  Tokens:
    ::variable::             substituted at build time by base-branding from app/js/settings.js
                             (URLs of the LA services — biocache, bie, spatial, ...).
    ${grailsApplication...}  evaluated at RUNTIME by Grails. base-branding never touches these.

  Deployment (la-docker-compose):
    - this file -> /data/spatial-hub/views/layouts/spatial-layout.gsp   (external views resolver)
    - activate with:  skin.layout=spatial-layout
  No extra stylesheet is shipped: `navbar navbar-default` inherits the site's existing commonui/
  ala styles (the spatial-hub WAR's application.css provides them, same as every other module),
  so the header matches the rest of the site across all branding themes.
  See spatial-hub BootStrap.groovy (addExternalViews).
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

<!-- ===================== Living Atlas header ===================== -->
<%-- Nav labels carry data-i18n for optional i18next enhancement, plus static English
     fallback text so the header is fully usable without any extra JavaScript. --%>
<div class="la-spatial-header ${headerVisiblity}">
  <%-- margin-bottom:0 so the full-screen map sits flush under the bar (the only spatial tweak) --%>
  <nav class="navbar navbar-default" role="navigation" style="margin-bottom:0">
    <div class="container-fluid">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse"
                data-target="#la-spatial-nav" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="::centralServer::" data-i18n="general.orgfullname">${grailsApplication.config.skin?.orgNameLong ?: 'Living Atlas'}</a>
      </div>

      <div class="collapse navbar-collapse" id="la-spatial-nav">
        <ul class="nav navbar-nav navbar-right">
          <li><a data-i18n="nav.collectory" href="::collectoryURL::">Collections</a></li>
          <li><a data-i18n="nav.biocache" href="::biocacheURL::">Occurrences</a></li>
          <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button"
               aria-haspopup="true" aria-expanded="false"><span data-i18n="nav.more">More</span> <span class="caret"></span></a>
            <ul class="dropdown-menu ${loginStatus}">
              <li><a data-i18n="nav.species" href="::bieURL::">Species</a></li>
              <li><a data-i18n="nav.species-lists" href="::listsURL::">Species lists</a></li>
              <li><a data-i18n="nav.spatial" href="::spatialURL::">Spatial portal</a></li>
              <li><a data-i18n="nav.regions" href="::regionsURL::">Regions</a></li>
              <li><a data-i18n="nav.images" href="::imagesURL::">Images</a></li>
              <li role="separator" class="divider"></li>
              <li><a data-i18n="nav.datasets" href="::datasetsURL::">Datasets</a></li>
            </ul>
          </li>
        </ul>

        <!-- Login / logout (runtime, mirrors portal.gsp) -->
        <ul class="nav navbar-nav navbar-right">
          <g:if test="${request.userPrincipal == null}">
            <li><hf:loginLogout class="loginBtn"/></li>
          </g:if>
          <g:else>
            <li><g:link class="logoutBtn" url="${grailsApplication.config.grails.serverURL}/logout">Logout</g:link></li>
          </g:else>
        </ul>

        <!-- Species search — same runtime config source as portal.gsp -->
        <form method="get" action="${grailsApplication.config.bie.baseURL}${grailsApplication.config.bie.searchPath}"
              class="navbar-form navbar-right search-form">
          <div class="form-group">
            <input name="q" id="autocompleteHeader" type="text" class="form-control"
                   data-i18n="[placeholder]nav.searchbox" placeholder="Search species..." autocomplete="off"/>
          </div>
          <button type="submit" class="btn btn-default" aria-label="Search">
            <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
          </button>
        </form>
      </div>
    </div>
  </nav>
</div>
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
