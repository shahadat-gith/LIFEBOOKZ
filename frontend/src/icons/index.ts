import {
  HiOutlineHome,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineUser,
  HiOutlineUserAdd,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineBookOpen,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChat,
  HiOutlineShare,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineDocumentAdd,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineSave,
  HiOutlineCog,
  HiOutlineRefresh,
  HiOutlineLink,
  HiOutlineGlobe,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineFlag,
  HiOutlineSparkles,
  HiOutlineTranslate,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

import {
  FaGoogle,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaHeart,
  FaRegHeart,
  FaUserCheck,
  FaSpinner,
} from 'react-icons/fa';

import {
  MdVerified,
  MdPending,
} from 'react-icons/md';

export const Icons = {
  // Navigation
  home: HiOutlineHome,
  menu: HiOutlineMenu,
  close: HiOutlineX,
  chevronDown: HiOutlineChevronDown,
  chevronLeft: HiOutlineChevronLeft,
  chevronRight: HiOutlineChevronRight,
  arrowLeft: HiOutlineArrowLeft,
  arrowRight: HiOutlineArrowRight,

  // Auth & Users
  user: HiOutlineUser,
  userAdd: HiOutlineUserAdd,
  login: HiOutlineLogin,
  logout: HiOutlineLogout,
  lock: HiOutlineLockClosed,
  mail: HiOutlineMail,

  // Content
  book: HiOutlineBookOpen,
  edit: HiOutlinePencil,
  trash: HiOutlineTrash,
  chat: HiOutlineChat,
  share: HiOutlineShare,
  bookmark: HiOutlineBookmark,
  clock: HiOutlineClock,
  tag: HiOutlineTag,
  document: HiOutlineDocumentText,
  documentAdd: HiOutlineDocumentAdd,
  search: HiOutlineSearch,
  plus: HiOutlinePlus,
  check: HiOutlineCheck,
  save: HiOutlineSave,
  settings: HiOutlineCog,
  refresh: HiOutlineRefresh,
  link: HiOutlineLink,
  globe: HiOutlineGlobe,

  // Indicators
  checkCircle: HiOutlineCheckCircle,
  exclamationCircle: HiOutlineExclamationCircle,
  infoCircle: HiOutlineInformationCircle,
  shieldCheck: HiOutlineShieldCheck,
  star: HiOutlineStar,

  // Misc
  academic: HiOutlineAcademicCap,
  briefcase: HiOutlineBriefcase,
  flag: HiOutlineFlag,
  sparkles: HiOutlineSparkles,
  translate: HiOutlineTranslate,
  location: HiOutlineLocationMarker,

  // Brand Icons (FontAwesome)
  google: FaGoogle,
  github: FaGithub,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  heartSolid: FaHeart,
  heartRegular: FaRegHeart,
  userCheck: FaUserCheck,
  spinner: FaSpinner,

  // Material Design
  verified: MdVerified,
  pending: MdPending,
} as const;

export type IconName = keyof typeof Icons;
