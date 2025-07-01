# Guest Visit Tracking Fix

## Problem

The guest management page showed incorrect visit data:
- Number of visits stayed at 0
- Last visit remained empty

This was happening because guest visit counts were not being automatically updated when reservations were completed.

## Root Cause

The system had a disconnect between the reservation system and guest visit tracking:

1. **Guest Entity**: Had `visitCount` and `lastVisit` fields
2. **Manual Visit Recording**: The `recordVisit` API endpoint could manually increment visits
3. **Missing Integration**: When a reservation status changed to `COMPLETED`, the guest's visit count was not being updated automatically

## Solution

### 1. Backend Changes

#### Modified `reservation.service.ts`
- Added automatic guest visit tracking when reservation status changes to `COMPLETED`
- When a reservation is marked as completed, it now:
  - Increments the guest's `visitCount` by 1
  - Updates the guest's `lastVisit` to the current date

#### Updated `guest.service.ts`
- Added documentation to clarify the `recordVisit` method is for manual visits (walk-ins)
- Automatic visit tracking from reservations happens in the reservation service

### 2. Data Fix

#### SQL Script: `scripts/fix-guest-visits.sql`
- Updates existing guest visit counts based on completed reservations
- Sets correct `lastVisit` dates
- Ensures guests with no completed reservations have accurate zero counts

#### Shell Script: `scripts/fix-guest-visits.sh`
- Convenient wrapper to run the SQL fix
- Includes error checking and user feedback

## Usage

### To Fix Existing Data
```bash
cd reservations-api
./scripts/fix-guest-visits.sh
```

### Future Behavior
- Guest visits will be automatically tracked when reservations are completed
- Manual visit recording (for walk-ins) is still available via the `recordVisit` API
- No double-counting: each method serves a different purpose

## Files Modified

1. `reservations-api/src/modules/reservation/reservation.service.ts`
2. `reservations-api/src/modules/guest/guest.service.ts`
3. `reservations-api/scripts/fix-guest-visits.sql` (new)
4. `reservations-api/scripts/fix-guest-visits.sh` (new)

## Testing

After applying the fix:
1. Create a new reservation
2. Mark it as completed
3. Check the guest's visit count - it should increment
4. Check the guest's last visit date - it should be updated
5. Verify existing guests show correct visit counts after running the SQL fix 