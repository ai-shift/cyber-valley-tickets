// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract DateOverlapChecker {
    uint256 initialOffest;
    mapping(uint256 => uint256[]) dateRanges;

    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant BUCKET_SIZE = 256;

    function checkNoOverlap(
        uint256 id,
        uint256 startDate,
        uint256 endDate
    ) internal view returns (bool) {
        require(
            endDate - SECONDS_IN_DAY >= startDate,
            "Dates should differ at least for one day"
        );
        uint256[] storage buckets = dateRanges[id];
        // There are no any date ranges stored
        if (buckets.length == 0) {
            return true;
        }
        uint256 startDays = (startDate - initialOffest) / SECONDS_IN_DAY;
        uint256 endDays = (endDate - initialOffest) / SECONDS_IN_DAY;
        uint256 startBucketIdx = startDays / BUCKET_SIZE;
        // There is no bucket for the given range
        if (startBucketIdx >= buckets.length) {
            return true;
        }
        uint256 endBucketIdx = endDays / BUCKET_SIZE;
        uint256 startDaysWithBucketOffset = startDays -
            (startBucketIdx + 1) *
            BUCKET_SIZE;
        uint256 endDaysWithBucketOffset = endDays -
            (endBucketIdx + 1) *
            BUCKET_SIZE;

        // Easy way, date range inside of single bucket
        if (startBucketIdx == endBucketIdx) {
            uint256 mask = ((1 <<
                (endDaysWithBucketOffset - startDaysWithBucketOffset + 1)) -
                1) << startDaysWithBucketOffset;
            return mask & dateRanges[id][startBucketIdx] == 0;
        }

        // Got date range inside of two buckets
        uint256 startMask = ((1 << (256 - startDaysWithBucketOffset)) - 1) <<
            startDaysWithBucketOffset;
        // There is no bucket for the second part
        if (endBucketIdx >= buckets.length) {
            return startMask & dateRanges[id][startBucketIdx] == 0;
        }
        uint256 endMask = ((1 << (endDaysWithBucketOffset + 1)) - 1) << 0;
        return
            startMask & buckets[startBucketIdx] == 0 &&
            endMask & buckets[endBucketIdx] == 0;
    }
}
