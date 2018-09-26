
# MIDST TO-DO

<!-- *LAST UPDATE: 
Annelyse Gelman, September 26 2018 -->

##Ready for Review
1. [move a list item here when it's ready for review!]



## URGENT/Top Priority/Bug Fixes!
1. Timeline Mode: When clicking and dragging the playhead on the Timeline, simply moving the clicked-down mouse outside of the playhead region & into the type box should NOT automatically re-enter user into Type Mode. Type Mode should only be re-activated when the user actually CLICKS in the "type window" (above the timeline), or clicks again on the Timeline Mode icon (upper-right of window) while Timeline Mode is already activated.
1. CRITICAL ERROR - when opening existing files: error log pops up (see screenshot in errorlogs folder). 
1. CRITICAL ERROR: Timeline mode is broken in (previously-saved) .mds files that are opened within the app. 
1. Immediately after saving a new document/new name, title bar should read "Midst - New Document Name" (not remain saying Untitled Project).
1. After opening a previously saved document, title bar should read Midst - Document Name.

## Add New Feature: Responsive scrolling
1. In Timeline Mode, the portion of the document being "worked on" in the replay should always be visible. This scrolling/adjustment should be as gentle/subtle/graceful/undistracting as possible.
1. Note that we want responsive scrolling both WITHIN THE APP (in Timeline Mode) and ON THE WEBSITE (when readers play back poems —— note that poems published on the website are just effectively "always in Timeline Mode", but with additional features like timestamps visible).
1. It's important that this works well & feels natural!

## Add New Feature: Log timestamps
1. If Midst isn't already doing this, make sure we are logging timestamps. (Timestamps will NOT appear anywhere in the app visibly to the user, but will be used when we publish the poems online.)

## Add New Feature: Draft Markers
1. The problem, conceptually: We don't want people to save multiple drafts of a single poem as separate Midst documents (pizzapoem v1, pizzapoem v2, etc.). The whole point is that versioning happens WITHIN a single .mds file. But we need to give people a way to mark v1, v2, v3 of a single poem that is more overt than simply "scrub back in the Timeline until you find the version you want". This feature is called Draft Markers.
1. Draft Markers are small pale-red flag icons (https://commons.wikimedia.org/wiki/File:OOjs_UI_icon_flag-ltr.svg - i kinda like the simple one that's just a pole and a left facing triangle).
1. Add a grey Flag icon to the top of Midst, between the Folder (open) icon and the Rewind (timeline) icon.
1. This Flag icon in the top of Midst is greyed out by default. When the user clicks it, it turns pale red. The user has just added a Draft Marker! (We can maybe have some little animation here, a little glow that means "something happened!") When the user next performs ANY Action (an Action is defined as anything that gets recorded to the Timeline, see Terminology below), this main Flag turns grey again.
1. When the user adds a Draft Marker by clicking the main greyed out flag, & it turns red, Midst should simultaneously add a small red flag to the Timeline (just above it, on "top"/"planted in" it), in the spot corresponding to the Time the user just marked. 
1. obvious point but maybe worth saying: The Markers in the timeline must be "attached" to the version of the document that they're saved to, at that point in Time. (In other words if a user saves or loads a Draft Marker, & then starts typing, the draft marker will be ––in the background––effectively slowly moving 'backwards'.)
1. In Timeline Mode, in addition to clicking+dragging the Playhead to navigate in time, the user can click on any Draft Markers and jump to that point in time.
1. Double clicking on a Draft Marker allows the user to Name it (names should appear in a minimalist but legible fashion above each draft marker if they've been added -- font for this can be static, chosen by designer).


## Add New Feature: Autosave
1. Would be great to have an autosave function. The autosave works like this: docs that have never been saved are autosaved as temporary files that are recovered when the program restarts, with their Timelines intact (see what Word does when you've opened a new .doc, typed some shit, and force-quit, then reopen it). Docs that HAVE been saved simply continue to Autosave to their timelines. (Yes, this means that you really can't delete any history of a document from its timeline. If I open poem.mds that's already got a first draft in it, work on it for a while, and decide I don't like what I did, I can't just quit Midst and delete that progress—— it is autosaved/saved into the Timeline already.)


## Add New Feature: Export options
1. File-->Export As... allows user to export their current screen's text to .doc, .docx, .rtf, .txt, and .pdf. Nb this option should NOT be folded into File-->Save or the Save icon on the main screen (those things are ONLY for .mds files). It should be labeled Export as...


## Low priority UI/UX fixes
1. Fill in icons pale red——this should be subtle, noticeable when you need it but not obtrusive/attention-grabbing—— when they are activated; make mute outlines again (default) when de-activated. (Don't worry too much about how this looks aesthetically, since it will be designed
later.)
1. Top menu (with font choices, mode selection, etc.) should reappear on hover while in Focus mode.
1. Allow user to adjust margins of the entire document. This functionality should be as simple/minimal as possible – no need for a ruler, just some simple small sliding arrows.
1. Add font: Garamond
1. Allow user to adjust spacing between lines (add an item for this to the navigation bar): single-spaced, 1.5, and double-spaced options.

##Low priority: Fix scrubber bar in Timeline Mode.
1. Make scrubber bar more minimal: a thin ("pale" ish) line with a playhead that you can click and drag, not the thick "loading bar" type visual that we currently have.
1. Playhead should be an equilateral or isosceles triangle located just BELOW the timeline, pointing UP into (onto) it. This is important because the space just above the timeline will be reserved for Draft Markers (see below).



## Web features
1. Poems should integrate onto the website with the following:
-Timestamps show as the poem plays
-Draft markers are clickable
-Timeline is clickable (jump to point in time)
-Click and draggable playhead
-Play, pause, rewind/fast-forward options



## Feature ideas for the future, that we are NOT implementing now
1. Export to video/youtube
1. Initializing replay mode should also reveal (minimal, unobtrusive!) icons for play, pause, rewind, and fast-forward/fast-rewind.
1. Replace the gear icon for "timeline" with something that better represents what it does – maybe a clock icon?
1. Midst for mobile.
1. Allow multiple Midst documents to be open at once, in separate windows, while preventing the user from having poem.mds open in 2 windows simultaneously.
1. Add a new icon to the formatting bar for changing background color + font color (again, as minimalist/unobtrusive as possible).
1. Track highlighting as an activity? (Not sold on this yet.)
1. Logo design.
1. We may want some way to enable the timeline /markers/etc. to remain visible even when the user reenters type mode... not rn tho
1. Default draft marker names (v1, v2, v3)?

## Terminology (for new developers)
1. Type Mode: the default mode of Midst. You can type, delete, etc., & Midst records your Actions. 
1. Timeline Mode
1. Focus Mode
1. Action: anything that gets recorded to the Timeline. e.g. typing a letter, a space, changing the font. Things that are Not currently actions: highlighting text, simply clicking inside the document, scrolling, changing between Modes.
1. Draft Marker: versioning flags.






