<template>
  <div class="login card">
    <div class="card-header">
      <div class="card-title">
        Login
      </div>
    </div>
    <div class="card-body">
      <form class="login-form">
        <div>
          <div class="label">
            <div> E-mail </div>
            <div v-if="emailError" class="error"> {{ emailError }} </div>
          </div>
          <input
            v-model="email"
            class="input"
            :class="{'input-error': emailError}"
            type="mail"
            placeholder="Enter your E-mail."
            @focusout="checkEmail"
          >
        </div>
        <div class="sep">
          <div class="label">
            <div> Password </div>
            <div v-if="pwdError" class="error"> {{ pwdError }} </div>
          </div>
          <input
            v-model="password"
            class="input"
            :class="{'input-error': pwdError}"
            type="password"
            placeholder="Enter your password."
            @focusout="checkPassword"
          >
        </div>
        <div class="sep">
          <div v-if="loginError" class="error"> {{ loginError }} </div>
          <input class="btn btn-outline" type="button" value="Login" @click="submit">
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  middleware: 'auth',
  data () {
    return {
      email: '',
      password: '',
      emailError: undefined,
      pwdError: undefined,
      loginError: undefined
    }
  },
  methods: {
    submit () {
      this.checkEmail()
      this.checkPassword()

      if (!this.emailError && !this.pwdError) {
        this.$auth.loginWith('local', { data: { email: this.email, password: this.password } }).then((res) => {
          this.$router.push('/')
        }).catch((err) => {
          this.loginError = err.response.data.error
        })
      }
    },
    checkEmail () {
      /* eslint-disable */
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.email)) {
      /* eslint-enable */
        this.emailError = 'invalid email'
      } else {
        this.emailError = undefined
      }
    },
    checkPassword () {
      if (this.password.length < 10) {
        this.pwdError = 'short password'
      } else {
        this.pwdError = undefined
      }
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 25em;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.label {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.error {
  color: rgba(219, 27, 27);
}

.input-error {
  border-color: red !important;
}

.sep {
  margin-top: 2em;
}

.input {
  transition: border-color var(--clr-trans-spd) var(--clr-trans-tf);
  border: 1px var(--clr-bg-dec) solid;
  border-radius: 7px;
  padding: .9em .7em;
  margin-top: .3em;
  width: 100%;
}

.btn {
  width: 100%
}

.submit {
  cursor: pointer;
}
</style>
