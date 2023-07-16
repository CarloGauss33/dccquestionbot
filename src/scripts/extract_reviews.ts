import { JSDOM } from 'jsdom';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const BASEURL = 'https://ramosuc.cl/ramo/';
const CSV_PATH = './src/scripts/fixtures/courses.csv';

async function getCourseCodesFromCsv() {

  const courseCodes : string[] = [];

  const csvCodes = await fs.readFile(CSV_PATH, 'utf8');
  const lines = csvCodes.split('\n');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const [code, _] = line.split(';');
    courseCodes.push(code);
  }

  return courseCodes;

}

async function getPage(courseCode : string) {
  const uri = `${BASEURL}${courseCode}`;

  const response = await axios.get(uri);
  return response.data;
}


async function getCourseReviews(courseCode : string) {

  try {
    const response = await getPage(courseCode);

    const dom = new JSDOM(response);
    const document = dom.window.document;

    const reviews : string[] = [];

    document.querySelectorAll('div#comments div p').forEach((p) => {
      
      if(p.textContent)
        reviews.push(p.textContent.replace(/[\r\n]/gm, ''));
    });
    return reviews;
  }
  catch (error){
    console.log('Error scrapping course', courseCode);
    return [];
  }
  
}

function extractUsernameFromReview(review : string) {
  const username = review.split(' ')[1];
  return username.substring(0, username.length - 1);
}

function removeUsernameFromReview(review : string) {
  const reviewWords = review.split(' ');
  reviewWords.splice(1, 2);

  return reviewWords.join(' ');
}

async function getCsvFormattedReviews(courseCodes : string[])
{
  const formattedReviews : string[] = [];

  for (const courseCode of courseCodes) {
    console.log(courseCode)
    const reviews = await getCourseReviews(courseCode);

    if(reviews.length > 0){

      const csvReview = reviews.map(review => {
        const username = extractUsernameFromReview(review);
        const reviewWithoutUsername = removeUsernameFromReview(review);
        return `${courseCode};${username};${reviewWithoutUsername}`;
      }).join('\n') + '\n';

      formattedReviews.push(csvReview);
    }
  }

  return formattedReviews;
}

export async function storeReviewsToCSV() {

  const courseCodes : string[] = await getCourseCodesFromCsv();

  const formattedReviews : string[] = await getCsvFormattedReviews(courseCodes);

  const csv = 'code;username;content\n' + formattedReviews.join('').slice(0, -1);

  const filePath = path.join(__dirname, 'fixtures', 'reviews.csv');
  fs.writeFile(filePath, csv);

  return courseCodes;
}

storeReviewsToCSV();