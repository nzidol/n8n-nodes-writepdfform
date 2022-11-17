import { IExecuteFunctions } from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export class WritePDFForm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Write PDF Form data',
		name: 'writePDFForm',
		icon: 'fa:file-pdf',
		group: ['input'],
		version: 1,
		description: 'Writes data to fields in a PDF Form',
		defaults: {
			name: 'Write PDF Form',
			color: '#003355',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property from which to read the PDF file',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < length; itemIndex++) {

			try{

				item = items[itemIndex];
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

				if (item.binary === undefined) {
					item.binary = {};
				}

				const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				returnData.push({
					json: item.json,
					binary: { 'file': {'data': new TextDecoder().decode(await PDF(binaryData)), 'mimeType': 'PDF'}},
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return this.prepareOutputData(returnData);
	}
}

const DEFAULT_OPTIONS = {
		max: 0,
};

async function PDF(dataBuffer: ArrayBuffer) {
	const isDebugMode = false;

	const ret = {
		numpages: 0,
		numrender: 0,
		info: {},
		metadata: {},
		text: "",
		formData: {},
	};

	const pdfDoc = await PDFDocument.load(dataBuffer);

	const form = pdfDoc.getForm()

	const pdfBytes = pdfDoc.save();
	return pdfBytes;
}
