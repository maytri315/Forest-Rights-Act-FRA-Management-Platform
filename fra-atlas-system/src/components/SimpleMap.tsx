import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Mock GeoJSON data for IFR/CFR claims
const mockIFRClaims = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": {
        "claimId": "IFR001",
        "claimantName": "Ramesh Kumar",
        "status": "Approved",
        "area": "2.5 hectares",
        "claimType": "IFR",
        "submissionDate": "2023-06-15"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.5, 23.2]
      }
    },
    {
      "type": "Feature", 
      "properties": {
        "claimId": "IFR002",
        "claimantName": "Sita Devi",
        "status": "Pending",
        "area": "1.8 hectares",
        "claimType": "IFR",
        "submissionDate": "2023-07-20"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.3, 23.5]
      }
    }
  ]
};

const mockCFRClaims = {
  "type": "FeatureCollection" as const, 
  "features": [
    {
      "type": "Feature",
      "properties": {
        "claimId": "CFR001",
        "claimantName": "Adivasi Samiti Gwalior",
        "status": "Approved",
        "area": "15.2 hectares",
        "claimType": "CFR",
        "submissionDate": "2023-05-10"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.7, 23.8]
      }
    }
  ]
};

// Mock Village Assets data
const mockVillageAssets = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": {
        "assetId": "AST001",
        "assetType": "School Building", 
        "condition": "Good",
        "villageCode": "V123",
        "villageName": "Rampur",
        "detectedBy": "AI Asset Detection",
        "confidence": 0.92,
        "lastUpdated": "2024-01-15"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.4, 23.3]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "assetId": "AST002", 
        "assetType": "Water Tank",
        "condition": "Needs Repair",
        "villageCode": "V124",
        "villageName": "Govindpur",
        "detectedBy": "Satellite Analysis",
        "confidence": 0.87,
        "lastUpdated": "2024-01-20"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.6, 23.6]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "assetId": "AST003",
        "assetType": "Community Hall",
        "condition": "Excellent", 
        "villageCode": "V125",
        "villageName": "Shivnagar",
        "detectedBy": "Ground Survey",
        "confidence": 1.0,
        "lastUpdated": "2024-01-25"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.8, 23.4]
      }
    }
  ]
};

// Mock DSS Intervention Recommendations data
const mockDSSInterventions = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": {
        "villageCode": "V126",
        "villageName": "Krishnanagar",
        "interventionType": "water_infrastructure",
        "priority": "CRITICAL",
        "estimatedCost": 500000,
        "beneficiaries": 180,
        "ministry": "Ministry of Jal Shakti",
        "timelineMonths": 6,
        "successProbability": 0.85,
        "reasoning": "Village has critically low water index (25/100) with high ST population density"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.2, 23.7]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "villageCode": "V127",
        "villageName": "Banswada",
        "interventionType": "electricity_infrastructure", 
        "priority": "HIGH",
        "estimatedCost": 800000,
        "beneficiaries": 220,
        "ministry": "Ministry of Power",
        "timelineMonths": 8,
        "successProbability": 0.78,
        "reasoning": "Low electricity connectivity (30/100) affecting education and healthcare services"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.9, 23.1]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "villageCode": "V128",
        "villageName": "Dharampur",
        "interventionType": "health_infrastructure",
        "priority": "MEDIUM",
        "estimatedCost": 1500000,
        "beneficiaries": 320,
        "ministry": "Ministry of Health and Family Welfare",
        "timelineMonths": 12,
        "successProbability": 0.72,
        "reasoning": "Health facility index below threshold (35/100), needs Primary Health Center upgrade"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [78.1, 23.9]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "villageCode": "V129", 
        "villageName": "Tribal Colony",
        "interventionType": "road_connectivity",
        "priority": "HIGH",
        "estimatedCost": 2000000,
        "beneficiaries": 150,
        "ministry": "Ministry of Rural Development",
        "timelineMonths": 10,
        "successProbability": 0.80,
        "reasoning": "Poor road connectivity (20/100) hampering access to markets and emergency services"
      },
      "geometry": {
        "type": "Point", 
        "coordinates": [78.6, 23.0]
      }
    }
  ]
};

// Mock CSS Scheme Eligibility Zones
const mockSchemeEligibilityZones = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": {
        "zoneName": "PM-KISAN High Eligibility Zone",
        "schemeType": "PM_KISAN",
        "eligibilityRate": 85,
        "totalFarmers": 450,
        "eligibleFarmers": 383,
        "averageIncome": 45000,
        "description": "High concentration of small land holders eligible for PM-KISAN benefits"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.0, 23.0], [78.3, 23.0], [78.3, 23.3], [78.0, 23.3], [78.0, 23.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "zoneName": "DAJGUA Priority Area",
        "schemeType": "DAJGUA", 
        "eligibilityRate": 100,
        "totalVillages": 12,
        "stPopulation": 8500,
        "infrastructureGap": "high",
        "description": "Scheduled Tribe villages requiring comprehensive infrastructure development under DAJGUA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.5, 23.5], [78.9, 23.5], [78.9, 23.9], [78.5, 23.9], [78.5, 23.5]
        ]]
      }
    }
  ]
};

const SimpleMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };

    if (mapRef.current && !mapInstanceRef.current) {
      // Create map instance directly with Leaflet
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [23.0, 78.0],
        zoom: 6,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Add IFR Claims layer
      L.geoJSON(mockIFRClaims, {
        pointToLayer: (feature, latlng) => {
          const status = feature.properties.status;
          let color = '#F44336'; // Default: Rejected
          if (status === 'Approved') color = '#4CAF50';
          else if (status === 'Pending') color = '#FF9800';
          
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          let statusColor = '#F44336';
          if (props.status === 'Approved') statusColor = '#4CAF50';
          else if (props.status === 'Pending') statusColor = '#FF9800';
          
          layer.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #2196F3;">🌳 ${props.claimType} Claim</h4>
              <p style="margin: 4px 0;"><strong>ID:</strong> ${props.claimId}</p>
              <p style="margin: 4px 0;"><strong>Claimant:</strong> ${props.claimantName}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${statusColor};">${props.status}</span></p>
              <p style="margin: 4px 0;"><strong>Area:</strong> ${props.area}</p>
              <p style="margin: 4px 0;"><strong>Submitted:</strong> ${props.submissionDate}</p>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      // Add CFR Claims layer  
      L.geoJSON(mockCFRClaims, {
        pointToLayer: (feature, latlng) => {
          const status = feature.properties.status;
          let color = '#E91E63'; // Default: Rejected
          if (status === 'Approved') color = '#8BC34A';
          else if (status === 'Pending') color = '#FFC107';
          
          return L.circleMarker(latlng, {
            radius: 12,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
          });
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          let statusColor = '#E91E63';
          if (props.status === 'Approved') statusColor = '#8BC34A';
          else if (props.status === 'Pending') statusColor = '#FFC107';
          
          layer.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #8BC34A;">🏢 ${props.claimType} Claim</h4>
              <p style="margin: 4px 0;"><strong>ID:</strong> ${props.claimId}</p>
              <p style="margin: 4px 0;"><strong>Community:</strong> ${props.claimantName}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${statusColor};">${props.status}</span></p>
              <p style="margin: 4px 0;"><strong>Area:</strong> ${props.area}</p>
              <p style="margin: 4px 0;"><strong>Submitted:</strong> ${props.submissionDate}</p>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      // Add Village Assets layer
      L.geoJSON(mockVillageAssets, {
        pointToLayer: (feature, latlng) => {
          const assetType = feature.properties.assetType;
          const condition = feature.properties.condition;
          
          // Asset type colors
          let color = '#FF9800'; // Default
          
          if (assetType.includes('School')) {
            color = '#2196F3';
          } else if (assetType.includes('Water')) {
            color = '#00BCD4';
          } else if (assetType.includes('Hall') || assetType.includes('Community')) {
            color = '#9C27B0';
          }

          // Condition-based border color
          let borderColor = '#4CAF50'; // Good
          if (condition === 'Needs Repair') borderColor = '#FF5722';
          else if (condition === 'Excellent') borderColor = '#8BC34A';

          return L.circleMarker(latlng, {
            radius: 10,
            fillColor: color,
            color: borderColor,
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          let conditionColor = '#4CAF50';
          if (props.condition === 'Needs Repair') conditionColor = '#FF5722';
          else if (props.condition === 'Excellent') conditionColor = '#8BC34A';

          let confidenceText = '';
          if (props.confidence < 1.0) {
            confidenceText = `<p style="margin: 4px 0;"><strong>AI Confidence:</strong> ${(props.confidence * 100).toFixed(0)}%</p>`;
          }
          
          layer.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #FF9800;">🏗️ Village Asset</h4>
              <p style="margin: 4px 0;"><strong>ID:</strong> ${props.assetId}</p>
              <p style="margin: 4px 0;"><strong>Type:</strong> ${props.assetType}</p>
              <p style="margin: 4px 0;"><strong>Village:</strong> ${props.villageName} (${props.villageCode})</p>
              <p style="margin: 4px 0;"><strong>Condition:</strong> <span style="color: ${conditionColor};">${props.condition}</span></p>
              <p style="margin: 4px 0;"><strong>Detected by:</strong> ${props.detectedBy}</p>
              ${confidenceText}
              <p style="margin: 4px 0;"><strong>Last Updated:</strong> ${props.lastUpdated}</p>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      // Add DSS Intervention Recommendations layer
      L.geoJSON(mockDSSInterventions, {
        pointToLayer: (feature, latlng) => {
          const priority = feature.properties.priority;
          const interventionType = feature.properties.interventionType;
          
          // Priority-based colors
          let color = '#4CAF50'; // LOW
          if (priority === 'CRITICAL') color = '#F44336';
          else if (priority === 'HIGH') color = '#FF9800';
          else if (priority === 'MEDIUM') color = '#2196F3';
          
          // Intervention type icons (using different shapes)
          let radius = 12;
          if (interventionType === 'water_infrastructure') radius = 14;
          else if (interventionType === 'electricity_infrastructure') radius = 16;
          else if (interventionType === 'health_infrastructure') radius = 18;
          
          return L.circleMarker(latlng, {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
          });
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          
          // Priority color for display
          let priorityColor = '#4CAF50';
          if (props.priority === 'CRITICAL') priorityColor = '#F44336';
          else if (props.priority === 'HIGH') priorityColor = '#FF9800';
          else if (props.priority === 'MEDIUM') priorityColor = '#2196F3';
          
          // Format cost
          const formattedCost = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(props.estimatedCost);
          
          // Intervention type emoji
          let emoji = '🏗️';
          if (props.interventionType === 'water_infrastructure') emoji = '💧';
          else if (props.interventionType === 'electricity_infrastructure') emoji = '⚡';
          else if (props.interventionType === 'health_infrastructure') emoji = '🏥';
          else if (props.interventionType === 'road_connectivity') emoji = '🛣️';
          else if (props.interventionType === 'education_infrastructure') emoji = '🏫';
          
          layer.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #FF6B35;">${emoji} DSS Intervention Recommendation</h4>
              <p style="margin: 4px 0;"><strong>Village:</strong> ${props.villageName} (${props.villageCode})</p>
              <p style="margin: 4px 0;"><strong>Intervention:</strong> ${props.interventionType.replace(/_/g, ' ').toUpperCase()}</p>
              <p style="margin: 4px 0;"><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${props.priority}</span></p>
              <p style="margin: 4px 0;"><strong>Beneficiaries:</strong> ${props.beneficiaries} people</p>
              <p style="margin: 4px 0;"><strong>Estimated Cost:</strong> ${formattedCost}</p>
              <p style="margin: 4px 0;"><strong>Timeline:</strong> ${props.timelineMonths} months</p>
              <p style="margin: 4px 0;"><strong>Success Probability:</strong> ${(props.successProbability * 100).toFixed(1)}%</p>
              <p style="margin: 4px 0;"><strong>Ministry:</strong> ${props.ministry}</p>
              <hr style="margin: 8px 0;">
              <p style="margin: 4px 0; font-style: italic; color: #666;"><strong>Reasoning:</strong> ${props.reasoning}</p>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);

      // Add CSS Scheme Eligibility Zones layer
      L.geoJSON(mockSchemeEligibilityZones, {
        style: (feature) => {
          const schemeType = feature?.properties.schemeType;
          const eligibilityRate = feature?.properties.eligibilityRate || 50;
          
          // Scheme-based colors
          let color = '#2196F3'; // Default
          if (schemeType === 'PM_KISAN') color = '#4CAF50';
          else if (schemeType === 'DAJGUA') color = '#FF9800';
          else if (schemeType === 'JAL_JEEVAN_MISSION') color = '#00BCD4';
          
          // Opacity based on eligibility rate
          const opacity = Math.max(0.3, eligibilityRate / 100 * 0.7);
          
          return {
            color: color,
            weight: 2,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: opacity,
            dashArray: eligibilityRate < 60 ? '5, 10' : undefined
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          
          // Helper function for eligibility rate color
          const getEligibilityColor = (rate: number) => {
            if (rate >= 70) return '#4CAF50';
            if (rate >= 50) return '#FF9800';
            return '#F44336';
          };
          
          let schemeEmoji = '📋';
          if (props.schemeType === 'PM_KISAN') schemeEmoji = '🌾';
          else if (props.schemeType === 'DAJGUA') schemeEmoji = '🏘️';
          else if (props.schemeType === 'JAL_JEEVAN_MISSION') schemeEmoji = '💧';
          
          let additionalInfo = '';
          if (props.totalFarmers) {
            additionalInfo += `<p style="margin: 4px 0;"><strong>Total Farmers:</strong> ${props.totalFarmers}</p>`;
            additionalInfo += `<p style="margin: 4px 0;"><strong>Eligible Farmers:</strong> ${props.eligibleFarmers}</p>`;
            additionalInfo += `<p style="margin: 4px 0;"><strong>Average Income:</strong> ₹${props.averageIncome.toLocaleString()}</p>`;
          }
          
          if (props.totalVillages) {
            additionalInfo += `<p style="margin: 4px 0;"><strong>Total Villages:</strong> ${props.totalVillages}</p>`;
            additionalInfo += `<p style="margin: 4px 0;"><strong>ST Population:</strong> ${props.stPopulation.toLocaleString()}</p>`;
            additionalInfo += `<p style="margin: 4px 0;"><strong>Infrastructure Gap:</strong> ${props.infrastructureGap}</p>`;
          }
          
          layer.bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #1976D2;">${schemeEmoji} CSS Scheme Zone</h4>
              <p style="margin: 4px 0;"><strong>Zone:</strong> ${props.zoneName}</p>
              <p style="margin: 4px 0;"><strong>Scheme:</strong> ${props.schemeType.replace(/_/g, '-')}</p>
              <p style="margin: 4px 0;"><strong>Eligibility Rate:</strong> <span style="color: ${getEligibilityColor(props.eligibilityRate)}; font-weight: bold;">${props.eligibilityRate}%</span></p>
              ${additionalInfo}
              <hr style="margin: 8px 0;">
              <p style="margin: 4px 0; font-style: italic; color: #666;">${props.description}</p>
            </div>
          `);
        }
      }).addTo(mapInstanceRef.current);
    }

    // Cleanup function
    return cleanup;
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: '500px', width: '100%' }}
    />
  );
};

export default SimpleMap;