# addin-aemp
This Add-In enables users to download device data in AEMP format.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `npm install -g gulp-cli bower`
* Clone the repository `git clone https://github.com/geotab/addin-aemp.git addin-aemp`
* Navigate to the working directory `cd addin-aemp`
* Restore packages using `npm install` and `bower install`
* Run the sample `gulp serve`

## Installation
Add the configuration below to the System Settings > Add-Ins section of the MyGeotab database

```json
{
	"url": "https://app.geotab.com/addins/geotab/aemp/1.0.1/config.json"
}
```