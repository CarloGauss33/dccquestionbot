import axios from 'axios';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const BASEURL = 'https://buscacursos.uc.cl/';

async function getPage(semester: string, startCode: string) {
    const uri = `${BASEURL}?cxml_semestre=${semester}&cxml_sigla=${startCode}`;

    const response = await axios.get(uri);
    return response.data;
}

async function getUniqueCourse(semester: string, code: string) {
    const baseXpath = '/html/body/table/tbody/tr/td/div/div/div/div[3]/table/tbody/';
    const codeEndXpath = '/td[2]/div';
    const nameEndXpath = '/td[10]';

    const response = await getPage(semester, code);

    const dom = new JSDOM(response);
    const document = dom.window.document;

    const courses = [];

    const startTrIndex = 4;
    const endTrIndex = 100;

    for (let i = startTrIndex; i < endTrIndex; i++) {
        const codeXpath = baseXpath + `tr[${i}]` + codeEndXpath;
        const nameXpath = baseXpath + `tr[${i}]` + nameEndXpath;

        const codeElement = document.evaluate(codeXpath, document, null, 9, null).singleNodeValue;
        const nameElement = document.evaluate(nameXpath, document, null, 9, null).singleNodeValue;

        if (!codeElement || !nameElement) {
            break;
        }

        courses.push({
            code: codeElement.textContent,
            name: nameElement.textContent
        });
    }

    return courses;
}

async function getAllCoursesForPeriod(baseCode: string) {
    const startCode = baseCode;

    const coursesFirst = await getUniqueCourse('2023-1', startCode);
    const coursesLast = await getUniqueCourse('2023-2', startCode);

    const courses = coursesFirst.concat(coursesLast);

    // unique by code
    const uniqueCourses = courses.filter((course, index, self) =>
        index === self.findIndex((t) => (
            t.code === course.code
        ))
    );

    return uniqueCourses;
}

export async function storeCoursesToCSV(baseCode: string) {
    const courses = await getAllCoursesForPeriod(baseCode);
    const csv = courses.map(course => `${course.code};${course.name}`).join('\n') + '\n';

    const filePath = path.join(__dirname, 'fixtures', 'courses.csv');
    fs.appendFileSync(filePath, csv);
    return courses;
}


(async () => {
    await storeCoursesToCSV('IIC1');
    await storeCoursesToCSV('IIC2');
    await storeCoursesToCSV('IIC3');
})();