from django import forms

class SaveMap(forms.Form):
	mapname = forms.charField()
