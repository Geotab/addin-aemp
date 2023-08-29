# addin-aemp
This Add-In enables users to download device data in AEMP format.

## Installation
Add the configuration below to the System Settings > Add-Ins section of the MyGeotab database

```json
{
	"name": "AEMP Add-In",
	"supportEmail": "integrations@geotab.com",
	"version": "1.0.2",
	"items": [{
		"url": "https://cdn.jsdelivr.net/gh/Geotab/addin-aemp@master/app/AEMPFormat.html",
		"path": "EngineMaintenanceLink/",
		"menuName": {
			"en": "AEMP Add-In"
		},
		"icon": "https://cdn.jsdelivr.net/gh/Geotab/addin-aemp@master/app/images/icon.svg"
	}],
}
```