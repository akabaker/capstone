from django import forms

class UpdateNode(forms.Form):
	label = forms.CharField(max_length=50)

class FindPath(forms.Form):
	start = forms.CharField(max_length=100)
	end = forms.CharField(max_length=100)
