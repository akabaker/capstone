from django import forms

class NewMap(forms.Form):
	name = forms.CharField(max_length=50)
	description = forms.CharField(max_length=255)
	bounds_sw_lat = forms.DecimalField(widget=forms.HiddenInput)
	bounds_sw_lng = forms.DecimalField(widget=forms.HiddenInput)
	bounds_ne_lat = forms.DecimalField(widget=forms.HiddenInput)
	bounds_ne_lng = forms.DecimalField(widget=forms.HiddenInput)
