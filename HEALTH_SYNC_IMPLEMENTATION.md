# Apple Health & Google Health Connect Integration

This document outlines the complete implementation of health data synchronization for Weight Mate.

## 🏥 Overview

The health sync feature allows users to automatically import weight data from:
- **iOS**: Apple Health (HealthKit)
- **Android**: Google Health Connect (Google Fit is deprecated as of 2024)

## 📁 Files Created/Modified

### Core Services
- `src/services/health-sync.service.ts` - Main health sync service with deduplication logic
- `src/app/components/week-progress/week-progress.component.ts` - Added health sync functionality
- `src/app/components/week-progress/week-progress.component.html` - Added sync button UI
- `src/app/components/week-progress/week-progress.component.scss` - Added sync button styling

### Configuration
- `ios/App/App/Info.plist` - Added HealthKit permissions
- `ios/App/App/App.entitlements` - Added HealthKit capability
- `android/app/src/main/AndroidManifest.xml` - Added Health Connect permissions
- `src/app/app.module.ts` - Registered health sync service and premium components

### Dependencies
- `cordova-plugin-health` v3.2.4 - Compatible with Capacitor v4

## 🎯 Key Features

### 1. Smart Deduplication Algorithm
- **Date + Weight Matching**: Compares entries by date and weight value
- **Tolerance**: 0.1 unit tolerance to handle minor measurement variations
- **Efficient**: O(n*m) complexity optimized with early exits

```typescript
// Example deduplication logic
const isDuplicate = existingEntries.some(entry => {
  const sameDay = entryDate.toDateString() === targetDate.toDateString();
  const weightDiff = Math.abs(entryWeight - targetWeight);
  return sameDay && weightDiff <= 0.1;
});
```

### 2. Batch Processing
- **Chunk Size**: 50 entries per batch to prevent memory issues
- **Progress Tracking**: Real-time sync progress with UI updates
- **Memory Efficient**: Small delays between batches to prevent UI blocking

### 3. Unit Conversion
- **Automatic Detection**: Detects health data units (kg vs lbs)
- **Dual Storage**: Converts and stores both lbs and kg values
- **Precision**: Rounds to 1 decimal place for consistency

### 4. Premium Feature Gating
- **Access Control**: Health sync is premium-only
- **Upgrade Prompts**: Shows premium upgrade modal for free users
- **Visual Indicators**: Diamond icon and warning text for premium features

## 🔧 Technical Implementation

### Health Data Query
```typescript
const queryOptions = {
  startDate: new Date(Date.now() - (730 * 24 * 60 * 60 * 1000)), // 2 years
  endDate: new Date(),
  dataType: 'weight',
  limit: 1000
};
```

### Sync Process Flow
1. **Permission Check** - Request health data access
2. **Data Query** - Retrieve weight measurements from health platform
3. **Deduplication** - Compare against existing entries
4. **Conversion** - Convert units and create WeightLogId objects
5. **Batch Insert** - Use `bulkUpsertWeightLogEntries()` for efficiency
6. **Status Update** - Update UI with sync results

### Error Handling
- **Permission Denied**: Clear error message to user
- **Network Issues**: Retry logic with exponential backoff
- **Invalid Data**: Skip malformed entries, continue sync
- **Storage Errors**: Rollback mechanism for partial failures

## 🎨 User Experience

### Sync Button Location
- **Position**: Below salutation in dashboard header
- **States**: Normal, Loading, Success, Error
- **Premium Gate**: Shows upgrade prompt for free users

### Visual Feedback
- **Progress Bar**: Real-time sync progress (X/Y entries)
- **Success Toast**: "Synced X new weight entries"
- **Last Sync**: Shows last successful sync timestamp
- **Error Messages**: Clear, actionable error descriptions

### Premium Integration
```html
<div *appPremiumFeature; else healthSyncUpgradeTemplate">
  <!-- Premium sync button -->
</div>
<ng-template #healthSyncUpgradeTemplate>
  <!-- Upgrade prompt with diamond icon -->
</ng-template>
```

## 📱 Platform Configuration

### iOS (HealthKit)
**Info.plist additions:**
```xml
<key>NSHealthUpdateUsageDescription</key>
<string>Weight Mate would like to write weight data to Apple Health to sync your progress across apps.</string>
<key>NSHealthShareUsageDescription</key>
<string>Weight Mate would like to read your weight data from Apple Health to automatically import your weight measurements and track your progress.</string>
```

**App.entitlements:**
```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

### Android (Health Connect)
**AndroidManifest.xml additions:**
```xml
<uses-permission android:name="android.permission.health.READ_BODY_MEASUREMENTS" />
<uses-permission android:name="android.permission.health.WRITE_BODY_MEASUREMENTS" />

<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

## 🧪 Testing

### Web Testing
- **Mock Sync**: `healthSyncService.testSync()` for web development
- **Simulated Data**: 2 mock weight entries with duplicate detection
- **UI Testing**: Full sync flow without device requirements

### Device Testing
1. **Install Health App**: Ensure Apple Health or Health Connect is installed
2. **Add Test Data**: Add weight measurements in health app
3. **Test Permissions**: Verify permission prompts appear
4. **Test Sync**: Run sync and verify data appears in Weight Mate
5. **Test Deduplication**: Run sync again, verify no duplicates

### Testing Scenarios
- ✅ First sync with historical data
- ✅ Incremental sync (new data only)
- ✅ Duplicate prevention
- ✅ Permission denial handling
- ✅ Network error recovery
- ✅ Premium upgrade flow
- ✅ Unit conversion accuracy

## 🚀 Performance Optimizations

### Memory Management
- **Streaming**: Process data in 50-entry chunks
- **Garbage Collection**: Clear references between batches
- **Background Processing**: Non-blocking operations with async/await

### Network Efficiency
- **Date Range Limiting**: Only sync last 2 years (configurable)
- **Incremental Sync**: Track last sync date to avoid re-processing
- **Compression**: Minimal data transfer with targeted queries

### Storage Optimization
- **Bulk Operations**: Single database transaction for all new entries
- **Index Usage**: Leverage existing date/ID indexes for deduplication
- **Data Validation**: Pre-filter invalid entries before storage

## 🔒 Security & Privacy

### Data Handling
- **Minimal Access**: Only request weight data permissions
- **Local Storage**: All data stored locally using Ionic Storage + SQLite
- **No Cloud Sync**: Health data never leaves the device
- **Permission Respect**: Graceful handling of permission denials

### Privacy Compliance
- **Clear Descriptions**: Transparent permission descriptions
- **Opt-in Only**: Sync is user-initiated, never automatic
- **Data Ownership**: User maintains full control of their data

## 📊 Monitoring & Analytics

### Sync Metrics
- **Success Rate**: Track successful vs failed syncs
- **Data Volume**: Monitor number of entries synced
- **Performance**: Track sync duration and memory usage
- **Errors**: Log and categorize sync failures

### User Engagement
- **Feature Usage**: Track how often users sync
- **Premium Conversion**: Monitor upgrade rates from sync prompts
- **User Feedback**: Collect feedback on sync accuracy and performance

## 🔮 Future Enhancements

### Planned Features
- **Two-way Sync**: Write Weight Mate data back to health apps
- **Body Composition**: Sync muscle/fat percentage data
- **Multiple Sources**: Handle data from multiple health apps
- **Sync Scheduling**: Automatic background sync options
- **Conflict Resolution**: Handle conflicting weight measurements

### Technical Debt
- **Plugin Migration**: Plan migration to newer health plugins as available
- **Error Recovery**: Implement more sophisticated retry mechanisms
- **Testing**: Add comprehensive unit tests for sync logic
- **Documentation**: Add inline code documentation for complex algorithms

This implementation provides a robust, user-friendly health data sync feature that respects privacy, handles errors gracefully, and integrates seamlessly with Weight Mate's existing architecture.