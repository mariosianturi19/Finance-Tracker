import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/id';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

export const formatDate = (date: string | Date, format = 'DD MMMM YYYY') => {
  return dayjs(date).tz(JAKARTA_TIMEZONE).format(format);
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).tz(JAKARTA_TIMEZONE).format('DD MMMM YYYY, HH:mm');
};

export const getCurrentJakartaTime = () => {
  return dayjs().tz(JAKARTA_TIMEZONE);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};