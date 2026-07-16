import { HiOutlineLogin, HiOutlineLogout, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineShieldCheck, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineMenu, HiOutlineX, HiOutlineCheck, HiOutlineInformationCircle, HiOutlineViewGrid, HiOutlineBookOpen } from 'react-icons/hi';
import { FaUserCheck, FaRegUser } from 'react-icons/fa';
export const Icons = {
  login: HiOutlineLogin, logout: HiOutlineLogout, exclamationCircle: HiOutlineExclamationCircle,
  checkCircle: HiOutlineCheckCircle, shieldCheck: HiOutlineShieldCheck,
  user: HiOutlineUser, mail: HiOutlineMail, lock: HiOutlineLockClosed,
  menu: HiOutlineMenu, close: HiOutlineX, check: HiOutlineCheck, infoCircle: HiOutlineInformationCircle,
  dashboard: HiOutlineViewGrid, book: HiOutlineBookOpen,
  userCheck: FaUserCheck, userOutline: FaRegUser,
} as const;
