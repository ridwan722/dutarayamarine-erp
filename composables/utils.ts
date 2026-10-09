import moment from "moment";
import _ from "lodash";

export const romawian = async (a: number) => {
  let bulan;
  switch (a) {
    case 1:
      bulan = "I";
      break;
    case 2:
      bulan = "II";
      break;
    case 3:
      bulan = "III";
      break;
    case 4:
      bulan = "IV";
      break;
    case 5:
      bulan = "V";
      break;
    case 6:
      bulan = "VI";
      break;
    case 7:
      bulan = "VII";
      break;
    case 8:
      bulan = "VIII";
      break;
    case 9:
      bulan = "IX";
      break;
    case 10:
      bulan = "X";
      break;
    case 11:
      bulan = "XI";
      break;
    case 12:
      bulan = "XII";
  }
  return bulan;
};

export const countdeadline = (date: string) => {
  const dateline = moment(date);
  const now = moment();
  const selisih = dateline.diff(now, "days") + 1;
  let dataset = { selisih, color: "red" };
  if (selisih < 7) {
    dataset.color = "red";
  } else if (selisih < 30) {
    dataset.color = "orange";
  } else {
    dataset.color = "green";
  }
  return dataset;
};

export const duadigit = (number: number) => {
  return _.round(number, 2);
};

export const makerandom = () => {
  const i = _.toUpper(Math.random().toString(36).substr(2, 6));
  return i;
};

export const setsesion = (key: string, value: any) => {
  return sessionStorage.setItem(key, JSON.stringify(value));
};

export const getsesion = (key: string) => {
  return JSON.parse(sessionStorage.getItem(key) || "[]");
};

export const makeSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-") // ganti spasi
    .replace(/[^a-z0-9-]/g, "") // hapus karakter aneh
    .trim();
};

export const countdownday = (date: string) => {
  // Tanggal target
  const targetDate = moment(date);
  // Tanggal hari ini
  const today = moment();
  // Menghitung selisih hari
  const remainingDays = targetDate.diff(today, 'days');
  return remainingDays
}

export const getDeadlineColor = (tanggal: string) => {
  const hari = countdownday(tanggal);
  if (hari > 30) return "green";
  if (hari > 15) return "orange";
  if (hari > 5) return "red";
  return "red";
};
