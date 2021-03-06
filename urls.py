from django.conf.urls.defaults import patterns, include, url
from django.views.generic.simple import direct_to_template
from django.contrib import admin
from wayfinder.builder.views import *
admin.autodiscover()

urlpatterns = patterns('',
	(r'^$', builder),
	(r'^admin/', include(admin.site.urls)),
	(r'^accounts/login/$', 'django.contrib.auth.views.login'),
	(r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/builder'}),
	(r'^builder/$', builder),
	(r'^m/$', direct_to_template, {'template': 'mobile.html'}),
	(r'^nearby', closest_nodes),
	(r'^register/$', register),
	(r'^createnode/$', create_node),
	(r'^loadnodes/$', load_nodes),
	(r'^deletenode/$', delete_node),
	(r'^updatenode/$', update_node),
	(r'^clearmap/$', clear_map),
	(r'^createpath/$', create_path),
	(r'^loadpaths/$', load_paths),
	(r'^destlist/$', dest_list),
	(r'^labellist/$', label_list),
	(r'^findpath/$', find_path),
	(r'^userauth/$', user_authenticated),
    # Examples:
    # url(r'^$', 'wayfinder.views.home', name='home'),
    # url(r'^wayfinder/', include('wayfinder.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
