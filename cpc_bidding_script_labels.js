/**
 * @name Bid To Impression Share
 *
 * @overview The Bid To Impression Share script adjusts your bids and allows you
 *     to steer ads in an advertiser account into a desired impression share in
 *     the search results. See original script
 *     https://developers.google.com/adwords/scripts/docs/solutions/bid-to-impression-share
 *     and for more details.
 *
 * @author Dmytro Tonkikh
 *
 * m.me/dmytro.tonkikh
 * t.me/dtonkikh
 * t.me/adwordsscripts
 *
 *
 *@modify by Sergey Komarchuk
 * t.me/TheTIOT
 */

// Impression share you are trying to achieve.
var TARGET_IMPRESSION_SHARE = 100;

// Once the keywords fall within TOLERANCE of TARGET_IMPRESSION_SHARE,
// their bids will no longer be adjusted.
var TOLERANCE = 10;

// How much to adjust the bids up.
var BID_ADJUSTMENT_COEFFICIENT_UP = 1.20;

// How much to adjust the bids down.
var BID_ADJUSTMENT_COEFFICIENT_DOWN = 1.20;

//max CPC
var maxCPC = 50;

//min CPC
var minCPC = 0.5;

//labels
var labelId = AdsApp.labels().withCondition("Name = 'HOT'").get().next().getId();


function main() {
  var report = AdWordsApp.report(
    "SELECT CampaignName, CampaignId, AdGroupId, Id, LabelIds, Labels, Criteria, CpcBid, FirstPageCpc, SearchImpressionShare, SearchTopImpressionShare, SearchAbsoluteTopImpressionShare " +
    "FROM KEYWORDS_PERFORMANCE_REPORT " +
    "WHERE CampaignName CONTAINS '' " +
    "AND Labels CONTAINS_ANY [" + labelId.toString() + "] " +
    "AND Ctr > 0.01 " +
    "AND Status = ENABLED " +
    "AND AdGroupStatus = ENABLED " +
    "AND CampaignStatus = ENABLED " +
    "DURING LAST_7_DAYS");
// TODAY, YESTERDAY, LAST_7_DAYS, LAST_14_DAYS
  
  var upload = AdWordsApp.bulkUploads().newCsvUpload([
    report.getColumnHeader('CampaignId').getBulkUploadColumnName(),
    report.getColumnHeader('AdGroupId').getBulkUploadColumnName(),
    report.getColumnHeader('Id').getBulkUploadColumnName(),
    report.getColumnHeader('Criteria').getBulkUploadColumnName(),
    report.getColumnHeader('FirstPageCpc').getBulkUploadColumnName(),
    report.getColumnHeader('CpcBid').getBulkUploadColumnName()]);
  
  upload.forCampaignManagement();
  
  var rows = report.rows();
  
  while (rows.hasNext()) {
    
    var row = rows.next();
    var Criteria = String(row['Criteria'].replace(/,/g,""),10);
    var ImpShare = parseFloat(row['SearchImpressionShare'].replace("%","").replace(/,/g,""),10)
    var TOPImpShare = row['SearchTopImpressionShare'] * 100
    var AbsoluteTOPImpShare = parseFloat (row ['SearchAbsoluteTopImpressionShare'].replace("%","").replace(/,/g,"").replace ("<",""))
    var CpcBid = parseFloat(row['CpcBid'].replace(/,/g,""),10);
    var FirstPageCpc = parseFloat(row['FirstPageCpc'].replace(/,/g,""),10);
    row.CpcBid = newCpcValue(Criteria, CpcBid, FirstPageCpc, ImpShare, TOPImpShare, AbsoluteTOPImpShare);
    upload.append(row.formatForUpload());
   
  }
  
  //upload.preview(); fot test USE ONLY
    upload.apply();

function newCpcValue (Criteria, CpcBid, FirstPageCpc, ImpShare, TOPImpShare, AbsoluteTOPImpShare) {
  var cpc = CpcBid;
  
  if (TOPImpShare >= TARGET_IMPRESSION_SHARE ) {
    cpc = CpcBid / BID_ADJUSTMENT_COEFFICIENT_DOWN;
  }
  
  if (TOPImpShare < (TARGET_IMPRESSION_SHARE - TOLERANCE)) {
    cpc = CpcBid * BID_ADJUSTMENT_COEFFICIENT_UP;
  }
  if(cpc < minCPC) {
    cpc = minCPC;
  }
  if(cpc > maxCPC) {
    cpc = CpcBid;
  }
  if(cpc < FirstPageCpc && FirstPageCpc < maxCPC)  {
    cpc = FirstPageCpc;
  }
  Logger.log([Criteria, CpcBid, cpc, FirstPageCpc, ImpShare, TOPImpShare, AbsoluteTOPImpShare])
  return cpc.toFixed(2);
}
}