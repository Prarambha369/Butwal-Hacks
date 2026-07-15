/** ponytail: English + Nepali translations. */

export type Locale = 'en' | 'ne';

const translations: Record<string, { en: string; ne: string }> = {
  'nav.home': { en: 'Home', ne: 'गृहपृष्ठ' },
  'nav.community': { en: 'Community', ne: 'समुदाय' },
  'nav.programs': { en: 'Programs', ne: 'कार्यक्रमहरू' },
  'nav.insights': { en: 'Insights', ne: 'अन्तरदृष्टि' },
  'nav.chapters': { en: 'Chapters', ne: 'अध्यायहरू' },
  'nav.events': { en: 'Events', ne: 'घटनाहरू' },
  'nav.about': { en: 'About', ne: 'बारेमा' },
  'nav.dashboard': { en: 'Dashboard', ne: 'ड्यासबोर्ड' },
  'nav.sign_in': { en: 'Sign In', ne: 'साइन इन' },
  'nav.sign_out': { en: 'Sign Out', ne: 'साइन आउट' },
  'home.hero.title': { en: "Lumbini's Youth Tech Hub — For Students, by Students.", ne: 'लुम्बिनीको युवा प्रविधि केन्द्र — विद्यार्थीहरूद्वारा, विद्यार्थीहरूको लागि।' },
  'home.hero.subtext': { en: "Free hackathons, mentorship, and project-based learning for students in Lumbini Province. Build real projects and earn verifiable credentials.", ne: 'लुम्बिनी प्रदेशका विद्यार्थीहरूको लागि नि:शुल्क ह्याकाथन, मेन्टरशिप, र परियोजना-आधारित सिकाइ। वास्तविक परियोजनाहरू बनाउनुहोस् र प्रमाणित प्रमाणहरू कमाउनुहोस्।' },
  'home.hero.cta_primary': { en: 'Start Building', ne: 'निर्माण सुरु गर्नुहोस्' },
  'home.hero.cta_secondary': { en: 'Explore the Hub', ne: 'हब अन्वेषण गर्नुहोस्' },
  'home.impact.title': { en: 'Our Impact', ne: 'हाम्रो प्रभाव' },
  'home.impact.subtitle': { en: 'Growing across Lumbini Province', ne: 'लुम्बिनी प्रदेशभर विस्तार हुँदै' },
  'home.initiatives.title': { en: 'Featured Initiatives', ne: 'विशेष पहलहरू' },
  'home.initiatives.subtitle': { en: 'Hands-on programs designed for youth in Nepal', ne: 'नेपालका युवाहरूको लागि डिजाइन गरिएको व्यावहारिक कार्यक्रमहरू' },
  'home.blog.title': { en: 'Latest Updates', ne: 'पछिल्लो अपडेटहरू' },
  'home.blog.subtitle': { en: 'Stories, insights, and community news', ne: 'कथाहरू, अन्तरदृष्टि, र समुदाय समाचार' },
  'chapters.title': { en: 'Find Your Local Chapter', ne: 'आफ्नो स्थानीय अध्याय खोज्नुहोस्' },
  'chapters.subtitle': { en: 'Join a chapter near you and start building with your local community.', ne: 'आफ्नो नजिकको अध्यायमा सामेल हुनुहोस् र आफ्नो स्थानीय समुदायसँग निर्माण सुरु गर्नुहोस्।' },
  'chapters.active': { en: 'Active Chapters', ne: 'सक्रिय अध्यायहरू' },
  'chapters.members': { en: 'Community Members', ne: 'समुदाय सदस्यहरू' },
  'chapters.events': { en: 'Events Hosted', ne: 'आयोजित घटनाहरू' },
  'chapters.join': { en: 'Join Chapter', ne: 'अध्यायमा सामेल हुनुहोस्' },
  'chapters.dashboard': { en: 'Chapter Dashboard', ne: 'अध्याय ड्यासबोर्ड' },
  'common.loading': { en: 'Loading...', ne: 'लोड हुँदै...' },
  'common.error': { en: 'Something went wrong', ne: 'केही गलत भयो' },
  'common.retry': { en: 'Try Again', ne: 'पुनः प्रयास गर्नुहोस्' },
  'common.save': { en: 'Save', ne: 'सुरक्षित गर्नुहोस्' },
  'common.cancel': { en: 'Cancel', ne: 'रद्द गर्नुहोस्' },
  'common.delete': { en: 'Delete', ne: 'मेटाउनुहोस्' },
  'common.edit': { en: 'Edit', ne: 'सम्पादन गर्नुहोस्' },
  'common.search': { en: 'Search', ne: 'खोज्नुहोस्' },
  'common.no_results': { en: 'No results found', ne: 'कुनै परिणाम फेला परेन' },
  'common.view_all': { en: 'View All', ne: 'सबै हेर्नुहोस्' },
  'common.learn_more': { en: 'Learn More', ne: 'थप जान्नुहोस्' },

  /* ── Additional nav keys ── */
  'nav.hackathon': { en: 'Hackathon', ne: 'ह्याकाथन' },
  'nav.mini_hackathon': { en: 'Mini Hackathon', ne: 'मिनी ह्याकाथन' },
  'nav.game_jam': { en: 'Game Jam', ne: 'गेम जाम' },
  'nav.learning_docs': { en: 'Learning Docs', ne: 'सिक्ने कागजातहरू' },
  'nav.community_hub': { en: 'Community Hub', ne: 'समुदाय केन्द्र' },
  'nav.volunteer': { en: 'Volunteer', ne: 'स्वयंसेवक' },
  'nav.governance': { en: 'Governance', ne: 'शासन' },
  'nav.transparency': { en: 'Transparency', ne: 'पारदर्शिता' },
  'nav.contact': { en: 'Contact', ne: 'सम्पर्क' },
  'nav.77_hacks': { en: '77 Hacks', ne: '७७ ह्याक्स' },
  'nav.sponsorship': { en: 'Sponsorship', ne: 'प्रायोजन' },
  'nav.notifications': { en: 'Notifications', ne: 'सूचनाहरू' },
  'nav.youth_tech_initiative': { en: 'Youth Tech Initiative', ne: 'युवा प्रविधि पहल' },
  'nav.sign_up': { en: 'Sign Up', ne: 'साइन अप' },

  /* ── Footer section headings ── */
  'footer.hackathons': { en: 'Hackathons', ne: 'ह्याकाथनहरू' },
  'footer.fellowship': { en: 'Fellowship', ne: 'फेलोशिप' },
  'footer.resources': { en: 'Resources', ne: 'स्रोतहरू' },
  'footer.about': { en: 'About Butwal Hacks', ne: 'बुटवल ह्याक्सको बारेमा' },

  /* ── Footer links ── */
  'footer.upcoming_events': { en: 'Upcoming Events', ne: 'आगामी घटनाहरू' },
  'footer.hackathon_guidelines': { en: 'Hackathon Guidelines', ne: 'ह्याकाथन दिशानिर्देशहरू' },
  'footer.past_wins': { en: 'Past Wins', ne: 'विगतका विजयहरू' },
  'footer.fellowship_programs': { en: 'Fellowship Programs', ne: 'फेलोशिप कार्यक्रमहरू' },
  'footer.how_it_works': { en: 'How it Works', ne: 'यसले कसरी काम गर्छ' },
  'footer.apply_now': { en: 'Apply Now', ne: 'अहिले नै आवेदन दिनुहोस्' },
  'footer.code_of_conduct': { en: 'Code of Conduct', ne: 'आचार संहिता' },
  'footer.dev_toolbox': { en: 'Dev Toolbox', ne: 'विकासकर्ता उपकरण बक्स' },
  'footer.branding_assets': { en: 'Branding Assets', ne: 'ब्रान्डिङ सम्पत्तिहरू' },
  'footer.our_story': { en: 'Our Story', ne: 'हाम्रो कथा' },
  'footer.team_board': { en: 'Team & Board', ne: 'टोली र बोर्ड' },
  'footer.open_collective': { en: 'Open Collective', ne: 'ओपन कलेक्टिभ' },
  'footer.contact_us': { en: 'Contact Us', ne: 'हामीलाई सम्पर्क गर्नुहोस्' },

  /* ── Footer brand / tagline ── */
  'footer.brand_statement': { en: 'Student-run, community-funded.', ne: 'विद्यार्थी-संचालित, समुदाय-वित्तपोषित।' },
  'footer.brand_description': {
    en: 'A youth-led nonprofit organizing free hackathons, hands-on workshops, and project-based learning for students across Lumbini Province, Nepal.',
    ne: 'नेपालको लुम्बिनी प्रदेशभरका विद्यार्थीहरूको लागि नि:शुल्क ह्याकाथन, व्यावहारिक कार्यशाला, र परियोजना-आधारित सिकाइ आयोजना गर्ने युवा-नेतृत्वको गैर-नाफामूलक संस्था।',
  },
  'footer.ignite_unite_lead': { en: 'Learn. Build. Ship.', ne: 'सिक्नुहोस्। निर्माण गर्नुहोस्। पठाउनुहोस्।' },
  'footer.copyright': {
    en: '\u00A9 {year} Butwal Hacks. A community-led collective funded via Open Collective and local contributions.',
    ne: '\u00A9 {year} बुटवल ह्याक्स। ओपन कलेक्टिभ र स्थानीय योगदान मार्फत कोष गरिएको समुदाय-नेतृत्व सामूहिक।',
  },
  'footer.toggle_theme': { en: 'Toggle Theme', ne: 'थिम स्विच गर्नुहोस्' },

  /* ── Footer legal links ── */
  'footer.privacy': { en: 'Privacy', ne: 'गोपनीयता' },
  'footer.terms': { en: 'Terms', ne: 'सर्तहरू' },
  'footer.cookies': { en: 'Cookies', ne: 'कुकीज' },
  'footer.legal': { en: 'Legal', ne: 'कानुनी' },

  /* ── Error pages ── */
  'error.unexpected': { en: 'An unexpected error occurred while processing your request. Our maintainers have been notified.', ne: 'तपाईंको अनुरोध प्रशोधन गर्दा एउटा अप्रत्याशित त्रुटि भयो। हाम्रो मर्मतकर्ताहरूलाई सूचित गरिएको छ।' },
  'error.details': { en: 'Error Details:', ne: 'त्रुटि विवरण:' },
  'error.digest': { en: 'Digest:', ne: 'डाइजेस्ट:' },
  'error.return_home': { en: 'Return to Home', ne: 'गृहपृष्ठमा फर्कनुहोस्' },
  'error.try_again': { en: 'Try Again', ne: 'पुनः प्रयास गर्नुहोस्' },

  /* ── Not found page ── */
  'not_found.title': { en: 'Page Not Found', ne: 'पृष्ठ फेला परेन' },
  'not_found.description': { en: "The page you're looking for doesn't exist or has been moved.", ne: 'तपाईंले खोजिरहनुभएको पृष्ठ अवस्थित छैन वा सारिएको छ।' },
  'not_found.back_home': { en: 'Back to Home', ne: 'गृहपृष्ठमा जानुहोस्' },
  'not_found.explore_community': { en: 'Explore Community', ne: 'समुदाय अन्वेषण गर्नुहोस्' },

  /* ── Offline page ── */
  'offline.title': { en: "You're Offline", ne: 'तपाईं अफलाइन हुनुहुन्छ' },
  'offline.description': { en: 'Butwal Hacks needs an internet connection to load the latest content. Please check your connection and try again.', ne: 'बुटवल ह्याक्सलाई नवीनतम सामग्री लोड गर्न इन्टरनेट जडान चाहिन्छ। कृपया तपाईंको जडान जाँच गर्नुहोस् र पुनः प्रयास गर्नुहोस्।' },

  /* ── Bottom navigation ── */
  'nav.explore': { en: 'Explore', ne: 'अन्वेषण' },
  'nav.profile': { en: 'Profile', ne: 'प्रोफाइल' },

  /* ── Dashboard ── */
  'dashboard.overview': { en: 'Overview', ne: 'सारांश' },
  'dashboard.settings': { en: 'Settings', ne: 'सेटिङ्हरू' },
  'dashboard.members': { en: 'Members', ne: 'सदस्यहरू' },
  'dashboard.teams': { en: 'Teams', ne: 'टोलीहरू' },
  'dashboard.projects': { en: 'Projects', ne: 'परियोजनाहरू' },
  'dashboard.analytics': { en: 'Analytics', ne: 'विश्लेषण' },
  'dashboard.welcome': { en: 'Welcome back', ne: 'फेरि स्वागत छ' },

  /* ── Status labels ── */
  'status.active': { en: 'Active', ne: 'सक्रिय' },
  'status.pending': { en: 'Pending', ne: 'पर्खिरहेको' },
  'status.completed': { en: 'Completed', ne: 'पूरा भयो' },
  'status.failed': { en: 'Failed', ne: 'असफल' },
  'status.success': { en: 'Success', ne: 'सफल' },
  'status.verified': { en: 'Verified', ne: 'प्रमाणित' },
  'status.unverified': { en: 'Unverified', ne: 'अप्रमाणित' },

  /* ── Form actions ── */
  'form.create': { en: 'Create', ne: 'सिर्जना गर्नुहोस्' },
  'form.update': { en: 'Update', ne: 'अद्यावधिक गर्नुहोस्' },
  'form.submit': { en: 'Submit', ne: 'पेश गर्नुहोस्' },
  'form.confirm': { en: 'Confirm', ne: 'पुष्टि गर्नुहोस्' },
  'form.upload': { en: 'Upload', ne: 'अपलोड गर्नुहोस्' },
  'form.share': { en: 'Share', ne: 'सेयर गर्नुहोस्' },
  'form.copy': { en: 'Copy', ne: 'प्रतिलिपि गर्नुहोस्' },
  'form.view_all': { en: 'View All', ne: 'सबै हेर्नुहोस्' },
  'form.no_data': { en: 'No data available', ne: 'कुनै डाटा उपलब्ध छैन' },
  'form.select_option': { en: 'Select an option', ne: 'एउटा विकल्प चयन गर्नुहोस्' },

  /* ── Feedback widget ── */
  'feedback.title': { en: 'Feedback', ne: 'प्रतिक्रिया' },
  'feedback.subtitle': { en: 'Help us improve Butwal Hacks', ne: 'बुटवल ह्याक्स सुधार गर्न हामीलाई मद्दत गर्नुहोस्' },
  'feedback.placeholder': { en: 'Share your thoughts...', ne: 'आफ्नो विचार साझा गर्नुहोस्...' },
  'feedback.send': { en: 'Send Feedback', ne: 'प्रतिक्रिया पठाउनुहोस्' },
  'feedback.sending': { en: 'Sending...', ne: 'पठाउँदै...' },
  'feedback.thank_you': { en: 'Thank you!', ne: 'धन्यवाद!' },
  'feedback.thanks_note': { en: 'Your feedback helps shape the future of Butwal Hacks.', ne: 'तपाईंको प्रतिक्रियाले बुटवल ह्याक्सको भविष्यलाई आकार दिन मद्दत गर्छ।' },
  'feedback.category_bug': { en: 'Bug', ne: 'त्रुटि' },
  'feedback.category_feature': { en: 'Feature', ne: 'सुविधा' },
  'feedback.category_improve': { en: 'Improve', ne: 'सुधार' },
  'feedback.category_other': { en: 'Other', ne: 'अन्य' },
  'feedback.description_bug': { en: "Something isn't working", ne: 'केही काम गरिरहेको छैन' },
  'feedback.description_feature': { en: 'I have an idea', ne: 'मसँग एउटा विचार छ' },
  'feedback.description_improve': { en: 'Make this better', ne: 'यसलाई राम्रो बनाउनुहोस्' },
  'feedback.description_other': { en: 'Something else', ne: 'अरू केही' },
  'feedback.min_length_error': { en: 'Please enter at least 3 characters.', ne: 'कृपया कम्तीमा ३ अक्षर प्रविष्ट गर्नुहोस्।' },
  'feedback.send_error': { en: 'Failed to send feedback.', ne: 'प्रतिक्रिया पठाउन असफल भयो।' },
  'feedback.anonymous': { en: 'No account needed — anonymous', ne: 'खाता आवश्यक छैन — गुमनाम' },
  'feedback.sent_as': { en: 'Feedback sent as', ne: 'को रूपमा प्रतिक्रिया पठाइयो' },

  /* ── Invite & Team ── */
  'team.invite': { en: 'Invite', ne: 'निम्तो' },
  'team.join': { en: 'Join', ne: 'सामेल हुनुहोस्' },
  'team.leave': { en: 'Leave', ne: 'छोड्नुहोस्' },
  'team.create_team': { en: 'Create Team', ne: 'टोली सिर्जना गर्नुहोस्' },
  'team.member_count': { en: '{count} member(s)', ne: '{count} सदस्य(हरू)' },

  /* ── Common empty / placeholder states ── */
  'empty.no_projects': { en: 'No projects yet', ne: 'अहिलेसम्म कुनै परियोजना छैन' },
  'empty.no_events': { en: 'No upcoming events', ne: 'कुनै आगामी घटनाहरू छैनन्' },
  'empty.no_members': { en: 'No members found', ne: 'कुनै सदस्य फेला परेनन्' },
  'empty.clear_filters': { en: 'Clear filters', ne: 'फिल्टरहरू खाली गर्नुहोस्' },
  'empty.no_results_for': { en: "No results match \"{query}\"", ne: '"{query}" सँग मेल खाने कुनै परिणाम छैन' },

  /* ── Profile ── */
  'profile.skills': { en: 'Skills', ne: 'सीपहरू' },
  'profile.socials': { en: 'Social Links', ne: 'सामाजिक लिङ्कहरू' },
  'profile.bh_id': { en: 'BH-ID', ne: 'BH-आईडी' },
  'profile.trust_markers': { en: 'Trust Markers', ne: 'विश्वास चिन्हहरू' },
  'profile.certificates': { en: 'Certificates', ne: 'प्रमाणपत्रहरू' },
  'profile.photos': { en: 'Photos', ne: 'फोटोहरू' },
  'profile.edit_profile': { en: 'Edit Profile', ne: 'प्रोफाइल सम्पादन गर्नुहोस्' },

  /* ── Auth pages ── */
  'auth.welcome': { en: 'Welcome to Butwal Hacks', ne: 'बुटवल ह्याक्समा स्वागत छ' },
  'auth.please_sign_in': { en: 'Please sign in to access your profile and hacker identity.', ne: 'कृपया आफ्नो प्रोफाइल र ह्याकर पहिचान पहुँच गर्न साइन इन गर्नुहोस्।' },
  'auth.sign_in_github': { en: 'Sign in with GitHub', ne: 'GitHub मार्फत साइन इन गर्नुहोस्' },
  'auth.sign_in_google': { en: 'Sign in with Google', ne: 'Google मार्फत साइन इन गर्नुहोस्' },
  'auth.claim_marker': { en: 'Sign in to claim this marker and add it to your Butwal Hacks profile.', ne: 'यो मार्कर दावी गर्न र आफ्नो बुटवल ह्याक्स प्रोफाइलमा थप्न साइन इन गर्नुहोस्।' },

  /* ── Time / relative dates ── */
  'time.just_now': { en: 'Just now', ne: 'अहिले मात्र' },
  'time.minutes_ago': { en: '{n} min ago', ne: '{n} मिनेट पहिले' },
  'time.hours_ago': { en: '{n}h ago', ne: '{n} घण्टा पहिले' },
  'time.days_ago': { en: '{n}d ago', ne: '{n} दिन पहिले' },
  'time.weeks_ago': { en: '{n}w ago', ne: '{n} हप्ता पहिले' },

  /* ── Button / action labels ── */
  'action.more': { en: 'More', ne: 'थप' },
  'action.close': { en: 'Close', ne: 'बन्द गर्नुहोस्' },
  'action.back': { en: 'Back', ne: 'पछाडि' },
  'action.next': { en: 'Next', ne: 'अर्को' },
  'action.enable': { en: 'Enable', ne: 'सक्षम गर्नुहोस्' },
  'action.disable': { en: 'Disable', ne: 'अक्षम गर्नुहोस्' },
  'action.approve': { en: 'Approve', ne: 'स्वीकृत गर्नुहोस्' },
  'action.reject': { en: 'Reject', ne: 'अस्वीकृत गर्नुहोस्' },
  'action.restore': { en: 'Restore', ne: 'पुनर्स्थापित गर्नुहोस्' },
  'action.archive': { en: 'Archive', ne: 'अभिलेख' },
  'action.download': { en: 'Download', ne: 'डाउनलोड गर्नुहोस्' },
  'action.preview': { en: 'Preview', ne: 'पूर्वावलोकन' },
  'action.refresh': { en: 'Refresh', ne: 'ताजा गर्नुहोस्' },
  'action.print': { en: 'Print', ne: 'प्रिन्ट गर्नुहोस्' },
  'action.filter': { en: 'Filter', ne: 'फिल्टर' },
  'action.sort': { en: 'Sort', ne: 'क्रमबद्ध गर्नुहोस्' },

  /* ── Search / Command Palette ── */
  'search.placeholder': { en: 'Search hackers, projects, events...', ne: 'ह्याकरहरू, परियोजनाहरू, घटनाहरू खोज्नुहोस्...' },
  'search.type_to_search': { en: 'Type at least 2 characters to search', ne: 'खोज्न कम्तीमा २ अक्षर टाइप गर्नुहोस्' },
  'search.search_hint': { en: 'Search profiles, projects, and events', ne: 'प्रोफाइल, परियोजना, र घटनाहरू खोज्नुहोस्' },
  'search.try_different': { en: 'Try a different search term', ne: 'फरक खोज शब्द प्रयास गर्नुहोस्' },
  'search.section_hackers': { en: 'Hackers', ne: 'ह्याकरहरू' },
  'search.section_projects': { en: 'Projects', ne: 'परियोजनाहरू' },
  'search.section_events': { en: 'Events', ne: 'घटनाहरू' },
  'search.kbd_navigate': { en: 'navigate', ne: 'नेभिगेट गर्नुहोस्' },
  'search.kbd_open': { en: 'open', ne: 'खोल्नुहोस्' },
  'search.kbd_close': { en: 'close', ne: 'बन्द गर्नुहोस्' },
  'search.subtitle_project': { en: 'Project', ne: 'परियोजना' },
  'search.subtitle_event': { en: 'Event', ne: 'घटना' },

  /* ── PWA Install Prompt ── */
  'pwa.install_title': { en: 'Install Butwal Hacks', ne: 'बुटवल ह्याक्स स्थापना गर्नुहोस्' },
  'pwa.install_desc': { en: 'Add to your home screen for quick access', ne: 'द्रुत पहुँचको लागि आफ्नो होम स्क्रिनमा थप्नुहोस्' },
  'pwa.install_button': { en: 'Install', ne: 'स्थापना गर्नुहोस्' },
  'pwa.update_title': { en: 'Update Available', ne: 'अपडेट उपलब्ध' },
  'pwa.update_desc': { en: 'A new version is ready', ne: 'नयाँ संस्करण तयार छ' },
  'pwa.refresh_button': { en: 'Refresh', ne: 'ताजा गर्नुहोस्' },
  'pwa.dismiss': { en: 'Dismiss', ne: 'खारेज गर्नुहोस्' },
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[key]?.[locale] ?? key;
}

