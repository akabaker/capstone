from django.conf.urls.defaults import patterns, include, url
from wayfinder.builder.views import builder, geo_code, find_path, register, save_state, savemap, newmap

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	(r'^builder/$', builder),
	(r'^$', builder),
	(r'^geocode/$', geo_code),
	(r'^save/$', save_state),
	(r'^findpath/$', find_path),
	(r'^admin/', include(admin.site.urls)),
	(r'^register/$', register),
	(r'^savemap/$', savemap),
	(r'^newmap/$', newmap),
	(r'^accounts/login/$', 'django.contrib.auth.views.login'),
	(r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/builder'}),
    # Examples:
    # url(r'^$', 'wayfinder.views.home', name='home'),
    # url(r'^wayfinder/', include('wayfinder.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
