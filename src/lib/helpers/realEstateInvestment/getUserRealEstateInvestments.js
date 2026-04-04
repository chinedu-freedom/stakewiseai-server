import { client } from "../../../lib/sanity.js";

export async function getAllRealEstateInvestments() {
  try {
    const investments = await client.fetch(
      `*[_type == "userInvestment" && planType == "realEstate"]{
        _id,
        status,
        amount,
        expectedROI,
        startDate,
        endDate,
        user->{
          _id,
          fullName,
          email
        },
        plan->{
          _id,
          title,
          roiEstimate,
          contractDuration,
          minInvestment
        }
      }`
    );

    return {
      success: true,
      message: "All real estate investments fetched successfully",
      status: 200,
      data: investments,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch real estate investments",
      status: 500,
      data: { details: error.message },
    };
  }
}



// import { client } from "../../../lib/sanity.js";

// export async function getUserRealEstateInvestments(userId) {
//   try {
//     const investments = await client.fetch(
//       `*[_type=="userInvestment"
//         && user._ref==$userId
//         && planType=="realEstate"]{
//           _id,
//           status,
//           amount,
//           expectedROI,
//           startDate,
//           endDate,
//           plan->{
//             _id,
//             title,
//             roiEstimate,
//             contractDuration,
//             minInvestment
//           }
//         }`,
//       { userId }
//     );

//     return {
//       success: true,
//       message: "Real estate investments fetched successfully",
//       status: 200,
//       data: investments,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: "Failed to fetch real estate investments",
//       status: 500,
//       data: { details: error.message },
//     };
//   }
// }
