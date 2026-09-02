/** Official provinces and territories of Pakistan. */
export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
  "Islamabad Capital Territory",
];

/** Major cities / district headquarters by province. */
export const PAKISTAN_CITIES_BY_PROVINCE = {
  Punjab: [
    "Attock",
    "Bahawalnagar",
    "Bahawalpur",
    "Bhakkar",
    "Chakwal",
    "Chiniot",
    "Dera Ghazi Khan",
    "Faisalabad",
    "Gujranwala",
    "Gujrat",
    "Hafizabad",
    "Jhang",
    "Jhelum",
    "Kamoke",
    "Kasur",
    "Khanewal",
    "Khushab",
    "Lahore",
    "Layyah",
    "Lodhran",
    "Mandi Bahauddin",
    "Mianwali",
    "Multan",
    "Murree",
    "Muzaffargarh",
    "Nankana Sahib",
    "Narowal",
    "Okara",
    "Pakpattan",
    "Rahim Yar Khan",
    "Rajanpur",
    "Rawalpindi",
    "Sahiwal",
    "Sargodha",
    "Sheikhupura",
    "Sialkot",
    "Taxila",
    "Toba Tek Singh",
    "Vehari",
    "Wah Cantonment",
  ],
  Sindh: [
    "Badin",
    "Dadu",
    "Ghotki",
    "Hyderabad",
    "Jacobabad",
    "Jamshoro",
    "Karachi",
    "Kashmore",
    "Khairpur",
    "Kotri",
    "Larkana",
    "Matiari",
    "Mirpur Khas",
    "Naushahro Feroze",
    "Nawabshah",
    "Sanghar",
    "Shikarpur",
    "Sukkur",
    "Tando Adam",
    "Tando Allahyar",
    "Tando Muhammad Khan",
    "Thatta",
    "Umerkot",
  ],
  "Khyber Pakhtunkhwa": [
    "Abbottabad",
    "Bannu",
    "Battagram",
    "Buner",
    "Charsadda",
    "Chitral",
    "Dera Ismail Khan",
    "Hangu",
    "Haripur",
    "Karak",
    "Kohat",
    "Lakki Marwat",
    "Lower Dir",
    "Malakand",
    "Mansehra",
    "Mardan",
    "Mingora",
    "Nowshera",
    "Peshawar",
    "Shangla",
    "Swabi",
    "Swat",
    "Tank",
    "Timergara",
    "Upper Dir",
  ],
  Balochistan: [
    "Awaran",
    "Chaman",
    "Dera Murad Jamali",
    "Gwadar",
    "Hub",
    "Jafarabad",
    "Kalat",
    "Khuzdar",
    "Killa Abdullah",
    "Killa Saifullah",
    "Lasbela",
    "Loralai",
    "Mastung",
    "Nushki",
    "Panjgur",
    "Pasni",
    "Pishin",
    "Quetta",
    "Sibi",
    "Turbat",
    "Usta Muhammad",
    "Zhob",
    "Ziarat",
  ],
  "Gilgit-Baltistan": [
    "Astore",
    "Chilas",
    "Gahkuch",
    "Gilgit",
    "Hunza",
    "Khaplu",
    "Nagar",
    "Shigar",
    "Skardu",
  ],
  "Azad Jammu and Kashmir": [
    "Bagh",
    "Bhimber",
    "Hattian Bala",
    "Haveli",
    "Kotli",
    "Mirpur",
    "Muzaffarabad",
    "Neelum",
    "Pallandri",
    "Rawalakot",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
};

export const provinceSelectOptions = (current) => {
  const value = String(current || "").trim();
  if (value && !PAKISTAN_PROVINCES.includes(value)) {
    return [value, ...PAKISTAN_PROVINCES];
  }
  return PAKISTAN_PROVINCES;
};

export const getCitiesForProvince = (province) => {
  const key = String(province || "").trim();
  return PAKISTAN_CITIES_BY_PROVINCE[key] || [];
};

export const citySelectOptions = (province, current) => {
  const cities = getCitiesForProvince(province);
  const value = String(current || "").trim();
  if (value && !cities.includes(value)) {
    return [value, ...cities];
  }
  return cities;
};

export const isPakistanProvince = (value) =>
  PAKISTAN_PROVINCES.includes(String(value || "").trim());
