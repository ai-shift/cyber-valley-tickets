// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";

contract DateOverlapChecker {
    uint256 initialOffest;
    mapping(uint256 => uint256[]) dateRanges;

    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant BUCKET_SIZE = 256;

    constructor(uint256 _initialOffest) {
        initialOffest = _initialOffest;
    }

    function checkNoOverlap(
        uint256 id,
        uint256 startDate,
        uint256 endDate
    ) internal view validDateRange(startDate, endDate) returns (bool) {
        uint256[] storage buckets = dateRanges[id];
        // There are no any date ranges stored
        if (buckets.length == 0) {
            return true;
        }
        uint256 startBucketIdx = dateToBucketIdx(startDate);
        // There is no bucket for the given range
        if (startBucketIdx >= buckets.length) {
            return true;
        }
        uint256 endBucketIdx = dateToBucketIdx(endDate);
        uint256 startDaysWithBucketOffset = dateToBucketRelativeDays(
            startDate,
            startBucketIdx
        );
        uint256 endDaysWithBucketOffset = dateToBucketRelativeDays(
            endDate,
            endBucketIdx
        );

        // Easy way, date range inside of single bucket
        if (startBucketIdx == endBucketIdx) {
            return
                daysRangeToMask(
                    startDaysWithBucketOffset,
                    endDaysWithBucketOffset
                ) &
                    buckets[startBucketIdx] ==
                0;
        }

        // Got date range inside of two buckets
        uint256 startMask = daysRangeToMask(startDaysWithBucketOffset, 255);
        // There is no bucket for the second part
        if (endBucketIdx >= buckets.length) {
            return startMask & buckets[startBucketIdx] == 0;
        }
        uint256 endMask = daysRangeToMask(0, endDaysWithBucketOffset);
        return
            startMask & buckets[startBucketIdx] == 0 &&
            endMask & buckets[endBucketIdx] == 0;
    }

    function freeDateRange(
        uint256 id,
        uint256 startDate,
        uint256 endDate
    ) internal validDateRange(startDate, endDate) returns (bool) {
        uint256[] storage buckets = dateRanges[id];
        uint256 startBucketIdx = dateToBucketIdx(startDate);
        uint256 endBucketIdx = dateToBucketIdx(endDate);

        uint256 startDaysWithBucketOffset = dateToBucketRelativeDays(
            startDate,
            startBucketIdx
        );
        uint256 endDaysWithBucketOffset = dateToBucketRelativeDays(
            endDate,
            endBucketIdx
        );

        if (
            startBucketIdx >= buckets.length || endBucketIdx >= buckets.length
        ) {
            return true;
        }

        if (startBucketIdx == endBucketIdx) {
            buckets[startBucketIdx] &= ~daysRangeToMask(
                startDaysWithBucketOffset,
                endDaysWithBucketOffset
            );
            return true;
        }

        buckets[startBucketIdx] &= ~daysRangeToMask(
            startDaysWithBucketOffset,
            255
        );
        buckets[endBucketIdx] &= ~daysRangeToMask(0, endDaysWithBucketOffset);
        return true;
    }

    function allocateDateRange(
        uint256 id,
        uint256 startDate,
        uint256 endDate
    ) internal validDateRange(startDate, endDate) returns (bool) {
        uint256[] storage buckets = dateRanges[id];
        uint256 startBucketIdx = dateToBucketIdx(startDate);
        uint256 endBucketIdx = dateToBucketIdx(endDate);

        uint256 startDaysWithBucketOffset = dateToBucketRelativeDays(
            startDate,
            startBucketIdx
        );
        uint256 endDaysWithBucketOffset = dateToBucketRelativeDays(
            endDate,
            endBucketIdx
        );

        createBucketsIfNeeded(buckets, startBucketIdx);

        if (startBucketIdx == endBucketIdx) {
            buckets[startBucketIdx] |= daysRangeToMask(
                startDaysWithBucketOffset,
                endDaysWithBucketOffset
            );
            return true;
        }
        createBucketsIfNeeded(buckets, endBucketIdx);

        buckets[startBucketIdx] |= daysRangeToMask(
            startDaysWithBucketOffset,
            255
        );
        buckets[endBucketIdx] |= daysRangeToMask(0, endDaysWithBucketOffset);
        return true;
    }

    function dateToBucketIdx(uint256 date) internal view returns (uint256) {
        return (date - initialOffest) / SECONDS_IN_DAY / BUCKET_SIZE;
    }

    function dateToBucketRelativeDays(
        uint256 date,
        uint256 bucketIdx
    ) internal view returns (uint256) {
        return
            (date - initialOffest) / SECONDS_IN_DAY - bucketIdx * BUCKET_SIZE;
    }

    function daysRangeToMask(
        uint256 start,
        uint256 end
    ) internal pure returns (uint256) {
        return ((1 << (end - start + 1)) - 1) << start;
    }

    function createBucketsIfNeeded(
        uint256[] storage buckets,
        uint256 bucketIdx
    ) internal {
        for (
            uint256 idx = Math.max(buckets.length, 1) - 1;
            idx <= bucketIdx;
            idx++
        ) {
            buckets.push(0);
        }
    }

    modifier validDateRange(uint256 startDate, uint256 endDate) {
        require(
            startDate >= initialOffest,
            "Start date should be after initial offset"
        );
        require(
            endDate >= initialOffest,
            "End date should be after initial offset"
        );
        require(
            endDate - startDate >= SECONDS_IN_DAY,
            "Dates should differ at least for one day"
        );
        _;
    }
}
