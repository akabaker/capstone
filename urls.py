from django.conf.urls.defaults import patterns, include, url
from django.views.generic.simple import direct_to_template
from wayfinder.builder.views import builder, register, create_node, load_nodes, update_node, clear_map, create_path, load_paths, delete_node, user_authenticated, dest_list
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	#(r'^builder/$', direct_to_template, {'template': 'builder.html'}),
	(r'^builder/$', builder),
	#(r'^$', direct_to_template, {'template': 'builder.html'}),
	(r'^$', builder),
	(r'^admin/', include(admin.site.urls)),
	(r'^register/$', register),
	(r'^createnode/$', create_node),
	(r'^loadnodes/$', load_nodes),
	(r'^deletenode/$', delete_node),
	(r'^updatenode/$', update_node),
	(r'^clearmap/$', clear_map),
	(r'^createpath/$', create_path),
	(r'^loadpaths/$', load_paths),
	(r'^destlist/$', dest_list),
	(r'^userauth/$', user_authenticated),
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
