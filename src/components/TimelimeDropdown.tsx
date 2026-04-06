"use client";

import React, { useState } from "react";

const TimelineDropdown = () => {
  const [isDropTimelineShow, setIsDropTimelineShow] = useState(false);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropTimelineShow((prev) => !prev);
    console.log(!isDropTimelineShow ? "shown" : "hidden");
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={toggleDropdown} className="_feed_timeline_post_dropdown_link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="4"
          height="17"
          fill="none"
          viewBox="0 0 4 17"
        >
          <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
          <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
          <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
        </svg>
      </button>

      {/* Dropdown container */}
      <div
        id="_timeline_drop"
        className={`_feed_timeline_dropdown _timeline_dropdown ${
          isDropTimelineShow ? "show" : ""
        }`}
      >
        <ul className="_feed_timeline_dropdown_list">
          <li className="_feed_timeline_dropdown_item">
            <a href="#0" className="_feed_timeline_dropdown_link">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="#1890FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.2"
                    d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z"
                  />
                </svg>
              </span>
              Save Post
            </a>
          </li>

          <li className="_feed_timeline_dropdown_item">
            <a href="#0" className="_feed_timeline_dropdown_link">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="22"
                  fill="none"
                  viewBox="0 0 20 22"
                >
                  <path
                    fill="#377DFF"
                    fillRule="evenodd"
                    d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              Turn On Notification
            </a>
          </li>

          <li className="_feed_timeline_dropdown_item">
            <a href="#0" className="_feed_timeline_dropdown_link">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="#1890FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.2"
                    d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5"
                  />
                </svg>
              </span>
              Hide
            </a>
          </li>

          <li className="_feed_timeline_dropdown_item">
            <a href="#0" className="_feed_timeline_dropdown_link">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="#1890FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.2"
                    d="M8.25 3H3a1.5 1.5 0 00-1.5 1.5V15A1.5 1.5 0 003 16.5h10.5A1.5 1.5 0 0015 15V9.75"
                  />
                  <path
                    stroke="#1890FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.2"
                    d="M13.875 1.875a1.591 1.591 0 112.25 2.25L9 11.25 6 12l.75-3 7.125-7.125z"
                  />
                </svg>
              </span>
              Edit Post
            </a>
          </li>

          <li className="_feed_timeline_dropdown_item">
            <a href="#0" className="_feed_timeline_dropdown_link">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="#1890FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.2"
                    d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5"
                  />
                </svg>
              </span>
              Delete Post
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default TimelineDropdown;
