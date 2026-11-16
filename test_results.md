# Test Results

| Test Case ID | Use Case | Test Function | Result | Actual Result |
|---|---|---|---|---|
| TC-F-01 | UC-09 | test_saved_trips_list_soonest_first | Pass | Matched expected result. |
| TC-F-02 | UC-09 | test_trip_card_shows_name_destination_and_time_frame | Pass | Matched expected result. |
| TC-F-03 | UC-09 | test_saved_trips_empty_state | Pass | Matched expected result. |
| TC-F-04 | UC-09 | test_saved_trips_only_shows_own_trips | Pass | Matched expected result. |
| TC-F-05 | UC-09 | test_day_tabs_match_trip_dates | Pass | Matched expected result. |
| TC-F-06 | UC-09 | test_friday_itinerary_heading_count_and_order | Pass | Matched expected result. |
| TC-F-07 | UC-09 | test_stop_detail_lines_show_category_duration_cost | Pass | Matched expected result. |
| TC-F-08 | UC-09 | test_saturday_one_stop_and_sunday_no_stops | Pass | Matched expected result. |
| TC-F-09 | UC-09 | test_trip_details_not_found | Pass | Matched expected result. |
| TC-F-10 | UC-09 | test_trip_details_other_users_trip_denied | Pass | Matched expected result. |
| TC-F-11 | UC-10 | test_edit_trip_name_destination_and_dates | Pass | Matched expected result. |
| TC-F-12 | UC-10 | test_trip_privacy_defaults_private_and_can_share_by_link | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes0-Trip name is required.] | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes1-Destination is required.] | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes2-Dates must be in YYYY-MM-DD format.] | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes3-End date cannot be before start date.] | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes4-Trip privacy must be 'private' or 'link'.] | Pass | Matched expected result. |
| TC-F-13 | UC-10 | test_edit_trip_invalid_inputs[changes5-Unknown field: budget] | Pass | Matched expected result. |
| TC-F-14 | UC-10 | test_edit_trip_dates_conflicting_with_stops | Pass | Matched expected result. |
| TC-F-15 | UC-10 | test_edit_trip_not_found_and_denied | Pass | Matched expected result. |
| TC-F-16 | UC-10 | test_delete_trip_success | Pass | Matched expected result. |
| TC-F-17 | UC-10 | test_delete_trip_twice_fails | Pass | Matched expected result. |
| TC-F-18 | UC-10 | test_delete_other_users_trip_denied_and_trip_survives | Pass | Matched expected result. |
| TC-F-19 | UC-10 | test_add_stop_success | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override0-Stop title is required.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override1-Stop date must fall within the trip dates.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override2-Times must be in HH:MM format.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override3-End time must be after start time.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override4-Category must be one of: Destination, Activity, Lodging.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override5-Estimated cost cannot be negative.] | Pass | Matched expected result. |
| TC-F-20 | UC-10 | test_add_stop_invalid_inputs[override6-Lodging stays must be at least 1 night.] | Pass | Matched expected result. |
| TC-F-21 | UC-10 | test_remove_stop_success | Pass | Matched expected result. |
| TC-F-22 | UC-10 | test_remove_stop_not_found | Pass | Matched expected result. |
| TC-N-01 | UC-09, UC-10 | test_nf_performance_saved_trips_1000_under_200ms | Pass | Matched expected result. |
| TC-N-02 | UC-09, UC-10 | test_nf_performance_day_view_with_500_stops_under_100ms | Pass | Matched expected result. |
| TC-N-03 | UC-09, UC-10 | test_nf_reliability_failed_edit_leaves_trip_unchanged | Pass | Matched expected result. |
| TC-N-04 | UC-09, UC-10 | test_nf_reliability_repeated_add_remove_is_consistent | Pass | Matched expected result. |
| TC-N-05 | UC-09, UC-10 | test_nf_usability_error_messages_are_user_safe | Pass | Matched expected result. |

**Summary:** 38 Pass / 0 Fail / 0 Not Run (total 38)
