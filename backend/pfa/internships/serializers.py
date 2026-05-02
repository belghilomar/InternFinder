from rest_framework import serializers
from .models import InternshipOffer, SearchHistory

class InternshipOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipOffer
        fields = '__all__'

class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = '__all__'
