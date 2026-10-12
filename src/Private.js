import { useState, useEffect } from "react";
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Private({ children }) {
  const [userData, setUserData] = useState();
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const checkLogin = async () => {
    onAuthStateChanged(auth, async (user) => {
      //se tem user logado
      if (user) {
        const userValues = {
          uid: user.uid,
          email: user.email,
        };
        setUserData(userValues);
      } else {
        //não possui user logado
        navigate("/login");
      }
    });
  };
  
  return userData && children;
}

export default Private;